import type { SessionSummary } from "../types";

interface Props {
  sessions: SessionSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

function formatDate(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
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
            padding: "10px 10px",
            borderRadius: 6,
            border: "none",
            background: s.id === activeId ? "#2a2a3a" : "transparent",
            color: "#ccc",
            cursor: "pointer",
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          <div
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {s.question.slice(0, 80)}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
              fontSize: 11,
              color: "#666",
            }}
          >
            <span style={{ fontWeight: 600, color: "#888" }}>
              {s.advisors.length} advisor{s.advisors.length !== 1 ? "s" : ""}
            </span>
            <span>&middot;</span>
            <span>{formatDate(s.timestamp)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
