import type { Advisor } from "../types";
import AdvisorCard from "./AdvisorCard";

interface Props {
  advisors: Advisor[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}

export default function BoardRoster({ advisors, selected, onToggle }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "16px 12px",
        overflowY: "auto",
      }}
    >
      <h2 style={{ fontSize: 14, color: "#888", margin: "0 0 8px", letterSpacing: 1, textTransform: "uppercase" }}>
        Board Members
      </h2>
      {advisors.map((a) => (
        <AdvisorCard
          key={a.id}
          advisor={a}
          selected={selected.has(a.id)}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
