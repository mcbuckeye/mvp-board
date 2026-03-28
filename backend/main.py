from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import advisors
import session as session_mod
import storage

app = FastAPI(title="MVP Board")

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


# ---------- routes ----------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/advisors")
def list_advisors():
    return advisors.get_all()


@app.post("/advisors")
def add_advisor(body: AdvisorCreate):
    prompt = body.system_prompt or (
        f"You are {body.name}, the {body.domain} expert. "
        f"Your core lens is: {body.lens}\n"
        f"Be direct, specific, and challenging. 2-4 paragraphs max. No fluff."
    )
    a = advisors.Advisor(
        id=body.id,
        name=body.name,
        domain=body.domain,
        lens=body.lens,
        color=body.color,
        system_prompt=prompt,
    )
    return advisors.add(a)


@app.post("/session")
async def create_session(body: SessionCreate):
    if not body.advisors:
        raise HTTPException(400, "Select at least one advisor")
    return await session_mod.create_session(body.question, body.advisors)


@app.get("/sessions")
def list_sessions():
    return storage.list_sessions()


@app.get("/session/{session_id}")
def get_session(session_id: str):
    s = storage.load_session(session_id)
    if s is None:
        raise HTTPException(404, "Session not found")
    return s
