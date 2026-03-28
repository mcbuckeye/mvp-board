"""Add round column to session_responses

Revision ID: 002
Revises: 001
Create Date: 2026-03-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "session_responses",
        sa.Column("round", sa.Integer, nullable=False, server_default="1"),
    )
    op.create_index("ix_session_responses_session_round", "session_responses", ["session_id", "round"])


def downgrade() -> None:
    op.drop_index("ix_session_responses_session_round", table_name="session_responses")
    op.drop_column("session_responses", "round")
