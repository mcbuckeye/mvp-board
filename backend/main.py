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
from models import User


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="MVP Board", lifespan=lifespan)

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


class AdvisorCreate(BaseModel):
    id: str
    name: str
    domain: str
    lens: str
    color: str = "#8B5CF6"
    system_prompt: str | None = None
    temperature: float = 0.7


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

    # Fetch user's custom advisors so session can use them
    custom = await storage.get_custom_advisors(db, user.id)
    session_data = await session_mod.create_session(body.question, body.advisors, custom)
    await storage.save_session(db, session_data, user.id)
    return session_data


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
