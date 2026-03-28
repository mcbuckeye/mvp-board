from __future__ import annotations

import os

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@mvpb-db:5432/mvpboard",
)

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:  # type: ignore[misc]
    async with async_session() as session:
        yield session


async def init_db() -> None:
    """Create all tables (used for dev/startup — Alembic handles migrations in prod)."""
    async with engine.begin() as conn:
        await conn.execute(sa.text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
