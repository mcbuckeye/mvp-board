from __future__ import annotations

import asyncio
import os
import uuid
from datetime import datetime, timezone

from openai import AsyncOpenAI

import advisors
import storage

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))


async def _ask_advisor(advisor: advisors.Advisor, question: str) -> dict:
    try:
        resp = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": advisor.system_prompt},
                {"role": "user", "content": question},
            ],
            temperature=0.8,
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


async def create_session(question: str, advisor_ids: list[str]) -> dict:
    selected = [advisors.get(aid) for aid in advisor_ids]
    selected = [a for a in selected if a is not None]

    tasks = [_ask_advisor(a, question) for a in selected]
    responses = await asyncio.gather(*tasks)

    session = {
        "id": uuid.uuid4().hex[:12],
        "question": question,
        "advisors": advisor_ids,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "responses": list(responses),
    }
    storage.save_session(session)
    return session
