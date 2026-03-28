import type { SessionSummary } from "../types";

interface Props {
  sessions: SessionSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export default function SessionHistory({ sessions, activeId, onSelect }: Props) {
  if (sessions.length === 0) {
    return (
      <div style={{ padding: 16, color: "#555", fontSize: 13 }}>
        No past sessions yet.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "8px 12px" }}>
      <h2
        style={{
          fontSize: 14,
          color: "#888",
          margin: "0 0 8px",
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        History
      </h2>
      {sessions.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: "8px 10px",
            borderRadius: 6,
            border: "none",
            background: s.id === activeId ? "#2a2a3a" : "transparent",
            color: "#ccc",
            cursor: "pointer",
            fontSize: 13,
            lineHeight: 1.4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {s.question.slice(0, 80)}
          <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
            {new Date(s.timestamp).toLocaleDateString()} &middot; {s.advisors.length} advisors
          </div>
        </button>
      ))}
    </div>
  );
}
