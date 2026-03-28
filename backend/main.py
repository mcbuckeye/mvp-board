from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import advisors
import session as session_mod
import storage
from auth import (
    create_token,
    get_current_user,
    hash_password,
    verify_password,
)
from database import get_db, init_db
from models import User, UserProfile


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="ConveneAgent", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- schemas ----------

class SessionCreate(BaseModel):
    question: str
    advisors: list[str]
    profile_ids: list[str] | None = None


class AdvisorCreate(BaseModel):
    id: str
    name: str
    domain: str
    lens: str
    color: str = "#8B5CF6"
    system_prompt: str | None = None
    temperature: float = 0.7


class ProfileCreate(BaseModel):
    profile_type: str
    title: str
    content: str = ""


class ProfileUpdate(BaseModel):
    profile_type: str | None = None
    title: str | None = None
    content: str | None = None


class RegisterRequest(BaseModel):
    email: str
    password: str
    display_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    token: str
    user: dict


class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str


# ---------- health ----------

@app.get("/health")
def health():
    return {"status": "ok"}


# ---------- auth routes ----------

@app.post("/auth/register", response_model=TokenResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(400, "Email already registered")

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        display_name=body.display_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_token(user.id)
    return {
        "token": token,
        "user": {"id": user.id, "email": user.email, "display_name": user.display_name},
    }


@app.post("/auth/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(401, "Invalid email or password")

    token = create_token(user.id)
    return {
        "token": token,
        "user": {"id": user.id, "email": user.email, "display_name": user.display_name},
    }


@app.get("/auth/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "display_name": user.display_name}


# ---------- profiles ----------

PROFILE_TEMPLATES = {
    "professional": {
        "profile_type": "professional",
        "title": "Professional Background",
        "content": "Role, company, industry, years of experience, key skills, current responsibilities, career goals...",
    },
    "financial": {
        "profile_type": "financial",
        "title": "Financial Context",
        "content": "Income sources, investment portfolio, retirement timeline, risk tolerance, financial goals...",
    },
    "personal": {
        "profile_type": "personal",
        "title": "Personal Background",
        "content": "Family situation, age, location, health status, personal goals, hobbies, values...",
    },
    "technical": {
        "profile_type": "technical",
        "title": "Technical Background",
        "content": "Tech stack, infrastructure, projects, tools, coding languages, certifications...",
    },
    "entrepreneurial": {
        "profile_type": "entrepreneurial",
        "title": "Entrepreneurial Context",
        "content": "Side projects, business ideas, revenue streams, acquisition interests...",
    },
    "health": {
        "profile_type": "health",
        "title": "Health Profile",
        "content": "Current health status, fitness level, diet, health goals, constraints...",
    },
}


@app.get("/profiles/templates")
async def get_profile_templates(user: User = Depends(get_current_user)):
    return PROFILE_TEMPLATES


@app.get("/profiles")
async def list_profiles(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await storage.list_profiles(db, user.id)


@app.post("/profiles")
async def create_profile(
    body: ProfileCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = UserProfile(
        user_id=user.id,
        profile_type=body.profile_type,
        title=body.title,
        content=body.content,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return {
        "id": profile.id,
        "profile_type": profile.profile_type,
        "title": profile.title,
        "content": profile.content,
        "created_at": profile.created_at.isoformat() if profile.created_at else None,
        "updated_at": profile.updated_at.isoformat() if profile.updated_at else None,
    }


@app.put("/profiles/{profile_id}")
async def update_profile(
    profile_id: str,
    body: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await storage.get_profile(db, profile_id, user.id)
    if profile is None:
        raise HTTPException(404, "Profile not found")
    if body.profile_type is not None:
        profile.profile_type = body.profile_type
    if body.title is not None:
        profile.title = body.title
    if body.content is not None:
        profile.content = body.content
    await db.commit()
    await db.refresh(profile)
    return {
        "id": profile.id,
        "profile_type": profile.profile_type,
        "title": profile.title,
        "content": profile.content,
        "created_at": profile.created_at.isoformat() if profile.created_at else None,
        "updated_at": profile.updated_at.isoformat() if profile.updated_at else None,
    }


@app.delete("/profiles/{profile_id}")
async def delete_profile(
    profile_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await storage.get_profile(db, profile_id, user.id)
    if profile is None:
        raise HTTPException(404, "Profile not found")
    await db.delete(profile)
    await db.commit()
    return {"ok": True}


# ---------- advisors ----------

@app.get("/advisors")
async def list_advisors(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    defaults = advisors.get_all()
    custom = await storage.get_custom_advisors(db, user.id)
    return [a.model_dump() for a in defaults] + custom


@app.post("/advisors")
async def add_advisor(
    body: AdvisorCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    prompt = body.system_prompt or (
        f"You are {body.name}, the {body.domain} expert. "
        f"Your core lens is: {body.lens}\n"
        f"Be direct, specific, and challenging. 2-4 paragraphs max. No fluff."
    )
    data = {
        "id": body.id,
        "name": body.name,
        "domain": body.domain,
        "lens": body.lens,
        "color": body.color,
        "system_prompt": prompt,
        "temperature": body.temperature,
    }
    return await storage.save_custom_advisor(db, user.id, data)


# ---------- sessions ----------

@app.post("/session")
async def create_session(
    body: SessionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not body.advisors:
        raise HTTPException(400, "Select at least one advisor")

    # Build question with profile context if provided
    question = body.question
    if body.profile_ids:
        profiles = await storage.get_profiles_by_ids(db, body.profile_ids, user.id)
        if profiles:
            context_parts = ["[USER CONTEXT]"]
            for p in profiles:
                context_parts.append(f"{p.title}: {p.content}")
            context_parts.append("[END USER CONTEXT]")
            context_parts.append("")
            context_parts.append(f"Question: {body.question}")
            question = "\n".join(context_parts)

    # Fetch user's custom advisors so session can use them
    custom = await storage.get_custom_advisors(db, user.id)
    session_data = await session_mod.create_session(question, body.advisors, custom)
    await storage.save_session(db, session_data, user.id)
    # Return full session from DB so shape matches (includes max_round, has_consensus)
    return await storage.load_session(db, session_data["id"], user.id)


@app.get("/sessions")
async def list_sessions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await storage.list_sessions(db, user.id)


@app.get("/session/{session_id}")
async def get_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    s = await storage.load_session(db, session_id, user.id)
    if s is None:
        raise HTTPException(404, "Session not found")
    return s


@app.post("/session/{session_id}/deliberate")
async def deliberate(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    s = await storage.load_session(db, session_id, user.id)
    if s is None:
        raise HTTPException(404, "Session not found")

    max_round = s["max_round"]
    # Exclude moderator from round count
    non_moderator_max = max(
        (r["round"] for r in s["responses"] if r["advisor_id"] != "moderator"),
        default=1,
    )
    if non_moderator_max >= 4:
        raise HTTPException(400, "Maximum deliberation rounds (3) reached")

    next_round = non_moderator_max + 1

    # Get the latest round's non-moderator responses to feed into deliberation
    latest_responses = [
        r for r in s["responses"] if r["round"] == non_moderator_max and r["advisor_id"] != "moderator"
    ]

    custom = await storage.get_custom_advisors(db, user.id)
    deliberation_responses = await session_mod.run_deliberation(
        question=s["question"],
        previous_responses=latest_responses,
        round_num=next_round,
        custom_advisors=custom,
    )

    await storage.save_responses(db, session_id, deliberation_responses, next_round)

    # Return the full updated session
    return await storage.load_session(db, session_id, user.id)


@app.post("/session/{session_id}/consensus")
async def consensus(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    s = await storage.load_session(db, session_id, user.id)
    if s is None:
        raise HTTPException(404, "Session not found")

    max_round = s["max_round"]
    if max_round < 2:
        raise HTTPException(400, "At least one deliberation round is required before generating consensus")

    if s["has_consensus"]:
        raise HTTPException(400, "Consensus report already generated for this session")

    # Pass all responses with their round numbers
    all_responses = [r for r in s["responses"] if r["advisor_id"] != "moderator"]
    consensus_response = await session_mod.generate_consensus(
        question=s["question"],
        all_responses=all_responses,
        max_round=max_round,
    )

    # Store consensus as a special round (max_round + 1)
    consensus_round = max_round + 1
    await storage.save_responses(db, session_id, [consensus_response], consensus_round)

    return await storage.load_session(db, session_id, user.id)
