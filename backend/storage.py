from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import CustomAdvisor, Session, SessionResponse


async def save_session(db: AsyncSession, session_data: dict[str, Any], user_id: str) -> Session:
    session = Session(
        id=session_data["id"],
        user_id=user_id,
        question=session_data["question"],
    )
    db.add(session)

    for r in session_data["responses"]:
        resp = SessionResponse(
            session_id=session.id,
            advisor_id=r["advisor_id"],
            name=r["name"],
            domain=r["domain"],
            color=r["color"],
            response=r["response"],
        )
        db.add(resp)

    await db.commit()
    return session


async def load_session(db: AsyncSession, session_id: str, user_id: str) -> dict[str, Any] | None:
    result = await db.execute(
        select(Session)
        .options(selectinload(Session.responses))
        .where(Session.id == session_id, Session.user_id == user_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        return None

    return {
        "id": session.id,
        "question": session.question,
        "advisors": [r.advisor_id for r in session.responses],
        "timestamp": session.timestamp.isoformat(),
        "responses": [
            {
                "advisor_id": r.advisor_id,
                "name": r.name,
                "domain": r.domain,
                "color": r.color,
                "response": r.response,
            }
            for r in session.responses
        ],
    }


async def list_sessions(db: AsyncSession, user_id: str) -> list[dict[str, Any]]:
    result = await db.execute(
        select(Session)
        .options(selectinload(Session.responses))
        .where(Session.user_id == user_id)
        .order_by(Session.timestamp.desc())
    )
    sessions = result.scalars().all()

    return [
        {
            "id": s.id,
            "question": s.question,
            "advisors": [r.advisor_id for r in s.responses],
            "timestamp": s.timestamp.isoformat(),
        }
        for s in sessions
    ]


async def get_custom_advisors(db: AsyncSession, user_id: str) -> list[dict[str, Any]]:
    result = await db.execute(
        select(CustomAdvisor).where(CustomAdvisor.user_id == user_id)
    )
    return [
        {
            "id": ca.advisor_id,
            "name": ca.name,
            "domain": ca.domain,
            "lens": ca.lens,
            "color": ca.color,
            "system_prompt": ca.system_prompt,
            "temperature": ca.temperature,
        }
        for ca in result.scalars().all()
    ]


async def save_custom_advisor(db: AsyncSession, user_id: str, data: dict[str, Any]) -> dict[str, Any]:
    ca = CustomAdvisor(
        user_id=user_id,
        advisor_id=data["id"],
        name=data["name"],
        domain=data["domain"],
        lens=data["lens"],
        color=data.get("color", "#8B5CF6"),
        system_prompt=data["system_prompt"],
        temperature=data.get("temperature", 0.7),
    )
    db.add(ca)
    await db.commit()
    return {
        "id": ca.advisor_id,
        "name": ca.name,
        "domain": ca.domain,
        "lens": ca.lens,
        "color": ca.color,
        "system_prompt": ca.system_prompt,
        "temperature": ca.temperature,
    }
