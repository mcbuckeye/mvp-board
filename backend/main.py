from __future__ import annotations

import json
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func, select
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
from embedding import chunk_and_embed_document
from models import AdvisorChunk, AdvisorDocument, BoardPreset, User, UserProfile


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Seed default advisor corpora asynchronously (don't block startup)
    import asyncio
    from seed_corpus import seed_default_corpora
    asyncio.create_task(seed_default_corpora())
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


class PresetCreate(BaseModel):
    name: str
    description: str | None = None
    advisor_ids: list[str]
    color: str = "#7C3AED"


class PresetUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    advisor_ids: list[str] | None = None
    color: str | None = None


class DocumentCreate(BaseModel):
    title: str
    content: str
    source_url: str | None = None
    source_type: str = "quote_collection"


class StarRequest(BaseModel):
    advisor_id: str | None = None


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
    session_data = await session_mod.create_session(question, body.advisors, custom, db=None)
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
        db=None,  # Don't pass db to parallel calls — causes greenlet conflicts
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


# ---------- streaming session (SSE) ----------

@app.post("/session/stream")
async def create_session_stream(
    body: SessionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not body.advisors:
        raise HTTPException(400, "Select at least one advisor")

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

    custom = await storage.get_custom_advisors(db, user.id)

    async def event_stream():
        session_data = await session_mod.create_session_streaming(question, body.advisors, custom, db=None)
        session_id = session_data["id"]

        # Save session shell first (no responses yet)
        await storage.save_session(db, {
            "id": session_id,
            "question": question,
            "responses": [],
        }, user.id)

        async for response in session_data["stream"]:
            # Save each response as it arrives
            await storage.save_responses(db, session_id, [response], 1)
            yield f"data: {json.dumps({'type': 'response', **response})}\n\n"

        yield f"data: {json.dumps({'type': 'complete', 'session_id': session_id})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ---------- star advisor ----------

@app.post("/session/{session_id}/star")
async def star_session_advisor(
    session_id: str,
    body: StarRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ok = await storage.star_advisor(db, session_id, user.id, body.advisor_id)
    if not ok:
        raise HTTPException(404, "Session not found")
    return {"ok": True, "starred_advisor_id": body.advisor_id}


# ---------- advisor documents (knowledge base) ----------

@app.get("/advisors/{advisor_id}/documents")
async def list_advisor_documents(
    advisor_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AdvisorDocument)
        .where(AdvisorDocument.advisor_id == advisor_id)
        .order_by(AdvisorDocument.created_at)
    )
    docs = result.scalars().all()
    out = []
    for d in docs:
        chunk_count = await db.execute(
            select(func.count(AdvisorChunk.id)).where(AdvisorChunk.document_id == d.id)
        )
        out.append({
            "id": d.id,
            "advisor_id": d.advisor_id,
            "title": d.title,
            "source_url": d.source_url,
            "source_type": d.source_type,
            "chunk_count": chunk_count.scalar() or 0,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        })
    return out


@app.post("/advisors/{advisor_id}/documents")
async def upload_advisor_document(
    advisor_id: str,
    body: DocumentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import uuid
    doc = AdvisorDocument(
        id=uuid.uuid4().hex,
        advisor_id=advisor_id,
        title=body.title,
        source_url=body.source_url,
        source_type=body.source_type,
        content=body.content,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # Chunk and embed in background-ish (still awaited but after commit)
    chunks = await chunk_and_embed_document(db, doc)

    return {
        "id": doc.id,
        "advisor_id": doc.advisor_id,
        "title": doc.title,
        "source_url": doc.source_url,
        "source_type": doc.source_type,
        "chunk_count": len(chunks),
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
    }


@app.delete("/advisors/{advisor_id}/documents/{doc_id}")
async def delete_advisor_document(
    advisor_id: str,
    doc_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AdvisorDocument).where(
            AdvisorDocument.id == doc_id,
            AdvisorDocument.advisor_id == advisor_id,
        )
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(404, "Document not found")
    await db.delete(doc)
    await db.commit()
    return {"ok": True}


@app.get("/advisors/{advisor_id}/documents/{doc_id}/chunks")
async def list_document_chunks(
    advisor_id: str,
    doc_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AdvisorChunk)
        .where(AdvisorChunk.document_id == doc_id, AdvisorChunk.advisor_id == advisor_id)
        .order_by(AdvisorChunk.chunk_index)
    )
    return [
        {
            "id": c.id,
            "chunk_index": c.chunk_index,
            "chunk_text": c.chunk_text,
            "has_embedding": c.embedding is not None,
        }
        for c in result.scalars().all()
    ]


@app.get("/knowledge-base/summary")
async def knowledge_base_summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns document count per advisor for the knowledge base overview."""
    from sqlalchemy import func as sa_func
    result = await db.execute(
        select(
            AdvisorDocument.advisor_id,
            sa_func.count(AdvisorDocument.id).label("doc_count"),
        ).group_by(AdvisorDocument.advisor_id)
    )
    return {row[0]: row[1] for row in result.fetchall()}


# ---------- presets ----------

SYSTEM_PRESETS = [
    {
        "id": "preset-strategy",
        "name": "Strategy Board",
        "description": "Innovation + OKRs + People + Positioning",
        "advisor_ids": ["jobs", "grove", "nooyi", "suntzu"],
        "color": "#7C3AED",
        "is_system": True,
    },
    {
        "id": "preset-investment",
        "name": "Investment Board",
        "description": "Value + Traction + Operations",
        "advisor_ids": ["buffett", "cuban", "whitman"],
        "color": "#22C55E",
        "is_system": True,
    },
    {
        "id": "preset-ethics",
        "name": "Ethics & Wisdom",
        "description": "Values + Clarity + Truth",
        "advisor_ids": ["mandela", "buddha", "oprah"],
        "color": "#F59E0B",
        "is_system": True,
    },
    {
        "id": "preset-full",
        "name": "Full Board",
        "description": "All 11 advisors convened",
        "advisor_ids": ["jobs", "cuban", "nooyi", "mandela", "musk", "grove", "suntzu", "whitman", "oprah", "buffett", "buddha"],
        "color": "#6366F1",
        "is_system": True,
    },
    {
        "id": "preset-disruption",
        "name": "Disruption Panel",
        "description": "Scale + Innovation + Traction",
        "advisor_ids": ["musk", "jobs", "cuban"],
        "color": "#3B82F6",
        "is_system": True,
    },
]


@app.get("/presets")
async def list_presets(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_presets = await storage.list_presets(db, user.id)
    return SYSTEM_PRESETS + user_presets


@app.post("/presets")
async def create_preset(
    body: PresetCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    preset = BoardPreset(
        user_id=user.id,
        name=body.name,
        description=body.description,
        advisor_ids=json.dumps(body.advisor_ids),
        color=body.color,
    )
    db.add(preset)
    await db.commit()
    await db.refresh(preset)
    return {
        "id": preset.id,
        "name": preset.name,
        "description": preset.description,
        "advisor_ids": json.loads(preset.advisor_ids),
        "color": preset.color,
        "is_system": False,
        "created_at": preset.created_at.isoformat() if preset.created_at else None,
    }


@app.put("/presets/{preset_id}")
async def update_preset(
    preset_id: str,
    body: PresetUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    preset = await storage.get_preset(db, preset_id, user.id)
    if preset is None:
        raise HTTPException(404, "Preset not found")
    if body.name is not None:
        preset.name = body.name
    if body.description is not None:
        preset.description = body.description
    if body.advisor_ids is not None:
        preset.advisor_ids = json.dumps(body.advisor_ids)
    if body.color is not None:
        preset.color = body.color
    await db.commit()
    await db.refresh(preset)
    return {
        "id": preset.id,
        "name": preset.name,
        "description": preset.description,
        "advisor_ids": json.loads(preset.advisor_ids),
        "color": preset.color,
        "is_system": False,
        "created_at": preset.created_at.isoformat() if preset.created_at else None,
    }


@app.delete("/presets/{preset_id}")
async def delete_preset(
    preset_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    preset = await storage.get_preset(db, preset_id, user.id)
    if preset is None:
        raise HTTPException(404, "Preset not found")
    await db.delete(preset)
    await db.commit()
    return {"ok": True}
