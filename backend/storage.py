from __future__ import annotations

from typing import Any

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import CustomAdvisor, Session, SessionResponse, UserProfile


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
            round=1,
        )
        db.add(resp)

    await db.commit()
    return session


async def save_responses(
    db: AsyncSession, session_id: str, responses: list[dict[str, Any]], round_num: int
) -> None:
    for r in responses:
        resp = SessionResponse(
            session_id=session_id,
            advisor_id=r["advisor_id"],
            name=r["name"],
            domain=r["domain"],
            color=r["color"],
            response=r["response"],
            round=round_num,
        )
        db.add(resp)
    await db.commit()


async def get_max_round(db: AsyncSession, session_id: str) -> int:
    result = await db.execute(
        select(func.max(SessionResponse.round)).where(SessionResponse.session_id == session_id)
    )
    val = result.scalar_one_or_none()
    return val or 1


async def get_responses_by_round(
    db: AsyncSession, session_id: str, round_num: int
) -> list[dict[str, Any]]:
    result = await db.execute(
        select(SessionResponse).where(
            SessionResponse.session_id == session_id,
            SessionResponse.round == round_num,
        )
    )
    return [
        {
            "advisor_id": r.advisor_id,
            "name": r.name,
            "domain": r.domain,
            "color": r.color,
            "response": r.response,
            "round": r.round,
        }
        for r in result.scalars().all()
    ]


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
        "advisors": list(dict.fromkeys(
            r.advisor_id for r in session.responses if r.advisor_id != "moderator"
        )),
        "timestamp": session.timestamp.isoformat(),
        "responses": [
            {
                "advisor_id": r.advisor_id,
                "name": r.name,
                "domain": r.domain,
                "color": r.color,
                "response": r.response,
                "round": r.round,
            }
            for r in sorted(session.responses, key=lambda r: (r.round, r.name))
        ],
        "max_round": max((r.round for r in session.responses), default=1),
        "has_consensus": any(r.advisor_id == "moderator" for r in session.responses),
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
            "advisors": list(dict.fromkeys(
                r.advisor_id for r in s.responses if r.advisor_id != "moderator"
            )),
            "timestamp": s.timestamp.isoformat(),
        }
        for s in sessions
    ]


async def list_profiles(db: AsyncSession, user_id: str) -> list[dict[str, Any]]:
    result = await db.execute(
        select(UserProfile)
        .where(UserProfile.user_id == user_id)
        .order_by(UserProfile.created_at)
    )
    return [
        {
            "id": p.id,
            "profile_type": p.profile_type,
            "title": p.title,
            "content": p.content,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        }
        for p in result.scalars().all()
    ]


async def get_profile(db: AsyncSession, profile_id: str, user_id: str) -> UserProfile | None:
    result = await db.execute(
        select(UserProfile).where(
            UserProfile.id == profile_id,
            UserProfile.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def get_profiles_by_ids(db: AsyncSession, profile_ids: list[str], user_id: str) -> list[UserProfile]:
    result = await db.execute(
        select(UserProfile).where(
            UserProfile.id.in_(profile_ids),
            UserProfile.user_id == user_id,
        )
    )
    return list(result.scalars().all())


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
