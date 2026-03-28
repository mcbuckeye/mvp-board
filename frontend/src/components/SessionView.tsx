import { useEffect, useState } from "react";
import type { Session } from "../types";

interface Props {
  session: Session;
}

export default function SessionView({ session }: Props) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    if (session.responses.length === 0) return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= session.responses.length) clearInterval(timer);
    }, 150);
    return () => clearInterval(timer);
  }, [session.id]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          padding: "12px 16px",
          background: "#1E1E2E",
          borderRadius: 8,
          borderLeft: "4px solid #7C3AED",
        }}
      >
        <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Question</div>
        <div style={{ fontSize: 15, color: "#eee" }}>{session.question}</div>
      </div>

      {session.responses.map((r, idx) => (
        <div
          key={r.advisor_id}
          style={{
            padding: "16px 20px",
            background: "#141414",
            borderRadius: 10,
            borderLeft: `4px solid ${r.color}`,
            opacity: idx < visibleCount ? 1 : 0,
            transform: idx < visibleCount ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: r.color,
              }}
            />
            <span style={{ fontWeight: 600, color: r.color, fontSize: 14 }}>
              {r.name}
            </span>
            <span style={{ fontSize: 12, color: "#666" }}>{r.domain}</span>
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "#ccc",
              whiteSpace: "pre-wrap",
            }}
          >
            {r.response}
          </div>
        </div>
      ))}
    </div>
  );
}
