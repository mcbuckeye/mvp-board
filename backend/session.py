from __future__ import annotations

import asyncio
import os
import uuid
from datetime import datetime, timezone

from openai import AsyncOpenAI

import advisors

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))


async def _ask_advisor(advisor: advisors.Advisor, question: str) -> dict:
    try:
        resp = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": advisor.system_prompt},
                {"role": "user", "content": question},
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


async def create_session(question: str, advisor_ids: list[str], custom_advisors: list[dict] | None = None) -> dict:
    # Build lookup of custom advisors by id
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

    tasks = [_ask_advisor(a, question) for a in selected]
    responses = await asyncio.gather(*tasks)

    session = {
        "id": uuid.uuid4().hex[:12],
        "question": question,
        "advisors": advisor_ids,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "responses": list(responses),
    }
    return session


def _resolve_advisor(advisor_id: str, custom_advisors: list[dict] | None = None) -> advisors.Advisor | None:
    if custom_advisors:
        for ca in custom_advisors:
            if ca["id"] == advisor_id:
                return advisors.Advisor(**ca)
    return advisors.get(advisor_id)


async def _deliberate_advisor(
    advisor: advisors.Advisor,
    question: str,
    other_responses: list[dict],
    round_num: int,
) -> dict:
    others_text = "\n\n".join(
        f"[{r['name']}] ({r['domain']}): {r['response']}"
        for r in other_responses
    )

    round_label = f"Round {round_num}" if round_num > 2 else "initial round"
    deliberation_prompt = (
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
        tasks.append(_deliberate_advisor(advisor, question, others, round_num))

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
