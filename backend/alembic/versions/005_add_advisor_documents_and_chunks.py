"""Add advisor_documents and advisor_chunks tables with pgvector

Revision ID: 005
Revises: 004
Create Date: 2026-03-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "advisor_documents",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("advisor_id", sa.String(50), nullable=False, index=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("source_url", sa.String(1000), nullable=True),
        sa.Column("source_type", sa.String(50), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "advisor_chunks",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "document_id",
            sa.String(36),
            sa.ForeignKey("advisor_documents.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("advisor_id", sa.String(50), nullable=False, index=True),
        sa.Column("chunk_text", sa.Text, nullable=False),
        sa.Column("chunk_index", sa.Integer, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Add vector column via raw SQL (pgvector type not available in sa.Column)
    op.execute("ALTER TABLE advisor_chunks ADD COLUMN embedding vector(1536)")


def downgrade() -> None:
    op.drop_table("advisor_chunks")
    op.drop_table("advisor_documents")
