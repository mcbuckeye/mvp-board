from __future__ import annotations

import asyncio
import os
import uuid
from datetime import datetime, timezone

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession as DBSession

import advisors
from retrieval import retrieve_context, format_rag_context

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))


async def _get_rag_context(db: DBSession | None, advisor_id: str, question: str) -> str:
    """Retrieve RAG context for an advisor using a dedicated DB connection.
    
    Uses a completely separate engine connection to avoid greenlet/transaction
    conflicts when called from asyncio.gather().
    """
    if db is None:
        return ""
    try:
        from database import engine
        async with engine.connect() as conn:
            from sqlalchemy import text as sql_text, select
            from models import AdvisorChunk
            # Quick check if advisor has any chunks
            check = await conn.execute(
                sql_text("SELECT 1 FROM advisor_chunks WHERE advisor_id = :aid LIMIT 1"),
                {"aid": advisor_id},
            )
            if check.fetchone() is None:
                return ""
            
            from embedding import embed_single
            question_embedding = await embed_single(question)
            embedding_str = "[" + ",".join(str(x) for x in question_embedding) + "]"
            
            result = await conn.execute(
                sql_text("""
                    SELECT c.chunk_text, d.title, 1 - (c.embedding <=> :embedding::vector) AS similarity
                    FROM advisor_chunks c
                    JOIN advisor_documents d ON c.document_id = d.id
                    WHERE c.advisor_id = :advisor_id AND c.embedding IS NOT NULL
                    ORDER BY c.embedding <=> :embedding::vector
                    LIMIT 5
                """),
                {"advisor_id": advisor_id, "embedding": embedding_str},
            )
            rows = result.fetchall()
            if not rows:
                return ""
            
            chunks = [{"chunk_text": r[0], "document_title": r[1], "similarity": float(r[2])} for r in rows]
            return format_rag_context(chunks)
    except Exception:
        return ""


async def _ask_advisor(advisor: advisors.Advisor, question: str, db: DBSession | None = None) -> dict:
    # RAG disabled in parallel calls due to SQLAlchemy greenlet conflicts
    # TODO: pre-fetch RAG contexts sequentially before parallel LLM calls
    rag_context = ""

    user_content = question
    if rag_context:
        user_content = f"{rag_context}\n\n{question}"

    try:
        resp = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": advisor.system_prompt},
                {"role": "user", "content": user_content},
            ],
            temperature=advisor.temperature,
            max_tokens=1024,
        )
        text = resp.choices[0].message.content or ""
    except Exception as e:
        text = f"[Error getting response: {e}]"

    return {
        "advisor_id": advisor.id,
        "name": advisor.name,
        "domain": advisor.domain,
        "color": advisor.color,
        "response": text,
    }


def _resolve_advisors(advisor_ids: list[str], custom_advisors: list[dict] | None = None) -> list[advisors.Advisor]:
    custom_map: dict[str, advisors.Advisor] = {}
    if custom_advisors:
        for ca in custom_advisors:
            custom_map[ca["id"]] = advisors.Advisor(**ca)

    selected: list[advisors.Advisor] = []
    for aid in advisor_ids:
        if aid in custom_map:
            selected.append(custom_map[aid])
        else:
            a = advisors.get(aid)
            if a is not None:
                selected.append(a)
    return selected


async def create_session(question: str, advisor_ids: list[str], custom_advisors: list[dict] | None = None, db: DBSession | None = None) -> dict:
    selected = _resolve_advisors(advisor_ids, custom_advisors)

    tasks = [_ask_advisor(a, question, db) for a in selected]
    responses = await asyncio.gather(*tasks)

    session = {
        "id": uuid.uuid4().hex[:12],
        "question": question,
        "advisors": advisor_ids,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "responses": list(responses),
    }
    return session


async def create_session_streaming(question: str, advisor_ids: list[str], custom_advisors: list[dict] | None = None, db: DBSession | None = None) -> dict:
    """Create a session that yields advisor responses one at a time as they complete."""
    selected = _resolve_advisors(advisor_ids, custom_advisors)
    session_id = uuid.uuid4().hex[:12]

    async def stream():
        tasks = {asyncio.ensure_future(_ask_advisor(a, question, db)): a for a in selected}
        for coro in asyncio.as_completed(tasks.keys()):
            result = await coro
            yield result

    return {
        "id": session_id,
        "question": question,
        "advisors": advisor_ids,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "stream": stream(),
    }


def _resolve_advisor(advisor_id: str, custom_advisors: list[dict] | None = None) -> advisors.Advisor | None:
    resolved = _resolve_advisors([advisor_id], custom_advisors)
    return resolved[0] if resolved else None


async def _deliberate_advisor(
    advisor: advisors.Advisor,
    question: str,
    other_responses: list[dict],
    round_num: int,
    db: DBSession | None = None,
) -> dict:
    # Skip RAG for deliberation — advisors already have full debate context
    rag_context = ""

    others_text = "\n\n".join(
        f"[{r['name']}] ({r['domain']}): {r['response']}"
        for r in other_responses
    )

    round_label = f"Round {round_num}" if round_num > 2 else "initial round"
    deliberation_prompt = ""
    if rag_context:
        deliberation_prompt += f"{rag_context}\n\n"
    deliberation_prompt += (
        f"ORIGINAL QUESTION:\n{question}\n\n"
        f"OTHER BOARD MEMBERS' RESPONSES FROM THE {round_label}:\n\n{others_text}\n\n"
        "You have heard the other board members' perspectives. Now respond: "
        "Where do you agree? Where do you strongly disagree? "
        "What critical point did everyone else miss? "
        "Challenge the weakest argument you heard. "
        "Be specific — reference other advisors by name."
    )

    try:
        resp = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": advisor.system_prompt},
                {"role": "user", "content": deliberation_prompt},
            ],
            temperature=advisor.temperature,
            max_tokens=1024,
        )
        text = resp.choices[0].message.content or ""
    except Exception as e:
        text = f"[Error getting response: {e}]"

    return {
        "advisor_id": advisor.id,
        "name": advisor.name,
        "domain": advisor.domain,
        "color": advisor.color,
        "response": text,
    }


async def run_deliberation(
    question: str,
    previous_responses: list[dict],
    round_num: int,
    custom_advisors: list[dict] | None = None,
    db: DBSession | None = None,
) -> list[dict]:
    """Each advisor responds to all OTHER advisors' latest-round responses."""
    # Get unique advisor IDs from the previous round's responses
    advisor_ids = list(dict.fromkeys(r["advisor_id"] for r in previous_responses))

    tasks = []
    for aid in advisor_ids:
        advisor = _resolve_advisor(aid, custom_advisors)
        if advisor is None:
            continue
        # All responses except this advisor's own
        others = [r for r in previous_responses if r["advisor_id"] != aid]
        tasks.append(_deliberate_advisor(advisor, question, others, round_num, db))

    responses = await asyncio.gather(*tasks)
    return list(responses)


MODERATOR_PROMPT = """You are the Board Moderator — a neutral, incisive synthesizer. Your job is to analyze a multi-round board deliberation and produce a clear consensus report.

You are analytical, precise, and fair. You do not take sides. You highlight where the board converged, where they clashed, and what the executive should actually do next.

Structure your report with these sections using markdown headers:

## Points of Agreement
Where advisors converged — shared conclusions across the board.

## Key Tensions
Fundamental disagreements that remain unresolved. Name the advisors on each side.

## Strongest Arguments
The most compelling points from each perspective. Credit the advisor by name.

## Recommended Actions
Concrete next steps. Note which advisors support each recommendation.

## Dissenting Views
Minority opinions that should not be ignored. Explain why they matter.

## Risk Assessment
What could go wrong with each major path. Map risks to the recommendations above.

Be specific, reference advisors by name, and keep it actionable. No fluff."""


async def generate_consensus(
    question: str,
    all_responses: list[dict],
    max_round: int,
) -> dict:
    """Generate a moderator consensus report from all rounds of responses."""
    # Group responses by round for clarity
    rounds_text = ""
    for rnd in range(1, max_round + 1):
        round_responses = [r for r in all_responses if r.get("round", 1) == rnd]
        if not round_responses:
            continue
        label = "Initial Responses" if rnd == 1 else f"Deliberation Round {rnd - 1}"
        rounds_text += f"\n### {label}\n\n"
        for r in round_responses:
            rounds_text += f"**{r['name']}** ({r['domain']}): {r['response']}\n\n"

    user_prompt = (
        f"ORIGINAL QUESTION:\n{question}\n\n"
        f"FULL BOARD DELIBERATION:\n{rounds_text}\n\n"
        "Synthesize the above into a consensus report."
    )

    try:
        resp = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": MODERATOR_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.4,
            max_tokens=2048,
        )
        text = resp.choices[0].message.content or ""
    except Exception as e:
        text = f"[Error generating consensus: {e}]"

    return {
        "advisor_id": "moderator",
        "name": "Board Moderator",
        "domain": "Consensus & Synthesis",
        "color": "#D97706",
        "response": text,
    }
