"""Add board_presets table and starred_advisor_id to sessions

Revision ID: 004
Revises: 003
Create Date: 2026-03-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "board_presets",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("advisor_ids", sa.Text, nullable=False),
        sa.Column("color", sa.String(10), nullable=False, server_default="#7C3AED"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.add_column(
        "sessions",
        sa.Column("starred_advisor_id", sa.String(50), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("sessions", "starred_advisor_id")
    op.drop_table("board_presets")
