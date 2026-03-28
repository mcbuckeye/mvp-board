from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).parent / "data" / "sessions"
DATA_DIR.mkdir(parents=True, exist_ok=True)


def _path(session_id: str) -> Path:
    return DATA_DIR / f"{session_id}.json"


def save_session(session: dict[str, Any]) -> None:
    _path(session["id"]).write_text(json.dumps(session, indent=2))


def load_session(session_id: str) -> dict[str, Any] | None:
    p = _path(session_id)
    if not p.exists():
        return None
    return json.loads(p.read_text())


def list_sessions() -> list[dict[str, Any]]:
    sessions: list[dict[str, Any]] = []
    for f in sorted(DATA_DIR.glob("*.json"), reverse=True):
        data = json.loads(f.read_text())
        sessions.append(
            {
                "id": data["id"],
                "question": data["question"],
                "advisors": data["advisors"],
                "timestamp": data["timestamp"],
            }
        )
    return sessions
