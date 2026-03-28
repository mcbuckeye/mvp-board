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
