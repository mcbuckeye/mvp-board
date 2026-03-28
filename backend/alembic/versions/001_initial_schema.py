"""Initial schema — users, sessions, session_responses, custom_advisors

Revision ID: 001
Revises: None
Create Date: 2026-03-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("display_name", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "sessions",
        sa.Column("id", sa.String(12), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("question", sa.Text, nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "session_responses",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("session_id", sa.String(12), sa.ForeignKey("sessions.id"), nullable=False, index=True),
        sa.Column("advisor_id", sa.String(50), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("domain", sa.String(100), nullable=False),
        sa.Column("color", sa.String(10), nullable=False),
        sa.Column("response", sa.Text, nullable=False),
    )

    op.create_table(
        "custom_advisors",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("advisor_id", sa.String(50), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("domain", sa.String(255), nullable=False),
        sa.Column("lens", sa.Text, nullable=False),
        sa.Column("color", sa.String(10), nullable=False, server_default="#8B5CF6"),
        sa.Column("system_prompt", sa.Text, nullable=False),
        sa.Column("temperature", sa.Float, nullable=False, server_default="0.7"),
    )


def downgrade() -> None:
    op.drop_table("custom_advisors")
    op.drop_table("session_responses")
    op.drop_table("sessions")
    op.drop_table("users")
