from __future__ import annotations

import uuid
from datetime import datetime, timezone

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return uuid.uuid4().hex[:12]


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    sessions: Mapped[list[Session]] = relationship(back_populates="user", cascade="all, delete-orphan")
    custom_advisors: Mapped[list[CustomAdvisor]] = relationship(back_populates="user", cascade="all, delete-orphan")
    profiles: Mapped[list[UserProfile]] = relationship(back_populates="user", cascade="all, delete-orphan")
    presets: Mapped[list[BoardPreset]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    starred_advisor_id: Mapped[str | None] = mapped_column(String(50), nullable=True)

    user: Mapped[User] = relationship(back_populates="sessions")
    responses: Mapped[list[SessionResponse]] = relationship(back_populates="session", cascade="all, delete-orphan")


class SessionResponse(Base):
    __tablename__ = "session_responses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    session_id: Mapped[str] = mapped_column(String(12), ForeignKey("sessions.id"), nullable=False, index=True)
    advisor_id: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    domain: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str] = mapped_column(String(10), nullable=False)
    response: Mapped[str] = mapped_column(Text, nullable=False)
    round: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")

    session: Mapped[Session] = relationship(back_populates="responses")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    profile_type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    user: Mapped[User] = relationship(back_populates="profiles")


class CustomAdvisor(Base):
    __tablename__ = "custom_advisors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    advisor_id: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    domain: Mapped[str] = mapped_column(String(255), nullable=False)
    lens: Mapped[str] = mapped_column(Text, nullable=False)
    color: Mapped[str] = mapped_column(String(10), nullable=False, default="#8B5CF6")
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    temperature: Mapped[float] = mapped_column(Float, nullable=False, default=0.7)

    user: Mapped[User] = relationship(back_populates="custom_advisors")


class AdvisorDocument(Base):
    __tablename__ = "advisor_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    advisor_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    source_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    chunks: Mapped[list["AdvisorChunk"]] = relationship(back_populates="document", cascade="all, delete-orphan")


class AdvisorChunk(Base):
    __tablename__ = "advisor_chunks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("advisor_documents.id"), nullable=False, index=True)
    advisor_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    embedding = mapped_column(Vector(1536), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    document: Mapped[AdvisorDocument] = relationship(back_populates="chunks")


class BoardPreset(Base):
    __tablename__ = "board_presets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    advisor_ids: Mapped[str] = mapped_column(Text, nullable=False)  # JSON array
    color: Mapped[str] = mapped_column(String(10), nullable=False, default="#7C3AED")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    user: Mapped[User] = relationship(back_populates="presets")
