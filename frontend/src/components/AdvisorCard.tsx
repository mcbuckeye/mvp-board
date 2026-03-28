import type { Advisor } from "../types";

interface Props {
  advisor: Advisor;
  selected: boolean;
  onToggle: (id: string) => void;
}

export default function AdvisorCard({ advisor, selected, onToggle }: Props) {
  return (
    <button
      onClick={() => onToggle(advisor.id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "10px 12px",
        borderRadius: 8,
        border: selected ? `2px solid ${advisor.color}` : "2px solid #333",
        background: selected ? `${advisor.color}18` : "#1a1a1a",
        cursor: "pointer",
        transition: "all 0.15s ease",
        color: "#eee",
        textAlign: "left",
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: selected ? advisor.color : "#555",
          flexShrink: 0,
        }}
      />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{advisor.name}</div>
        <div style={{ fontSize: 11, color: "#999" }}>{advisor.domain}</div>
      </div>
    </button>
  );
}
