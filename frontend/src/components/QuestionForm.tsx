import { useState } from "react";
import type { UserProfile } from "../types";

const TYPE_ICONS: Record<string, string> = {
  professional: "\u{1F4BC}",
  financial: "\u{1F4B0}",
  personal: "\u{1F464}",
  technical: "\u{1F527}",
  entrepreneurial: "\u{1F680}",
  health: "\u{2764}\uFE0F",
  custom: "\u{1F4DD}",
};

interface Props {
  selectedCount: number;
  loading: boolean;
  onSubmit: (question: string, profileIds: string[]) => void;
  profiles: UserProfile[];
}

export default function QuestionForm({ selectedCount, loading, onSubmit, profiles }: Props) {
  const [question, setQuestion] = useState("");
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [showProfiles, setShowProfiles] = useState(false);

  const canSubmit = question.trim().length > 0 && selectedCount >= 1 && !loading;

  const toggleProfile = (id: string) => {
    setSelectedProfiles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const profileCount = selectedProfiles.size;
  const buttonLabel = loading
    ? "The board is deliberating..."
    : `Convene the Board (${selectedCount} selected${profileCount > 0 ? `, ${profileCount} profile${profileCount > 1 ? "s" : ""} attached` : ""})`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="What strategic question would you like the board to weigh in on?"
        rows={4}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: 14,
          borderRadius: 8,
          border: "1px solid #333",
          background: "#141414",
          color: "#eee",
          fontSize: 15,
          resize: "vertical",
          fontFamily: "Inter, sans-serif",
        }}
      />

      {/* Profile context section */}
      {profiles.length > 0 && (
        <div>
          <button
            onClick={() => setShowProfiles(!showProfiles)}
            style={{
              background: "none",
              border: "1px solid #333",
              borderRadius: 6,
              color: profileCount > 0 ? "#A78BFA" : "#888",
              cursor: "pointer",
              fontSize: 12,
              padding: "6px 12px",
              fontFamily: "Inter, sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 6,
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <span>
              {profileCount > 0
                ? `${profileCount} profile${profileCount > 1 ? "s" : ""} attached as context`
                : "Attach profile context (optional)"}
            </span>
            <span style={{ fontSize: 10, color: "#666" }}>{showProfiles ? "\u25B2" : "\u25BC"}</span>
          </button>

          {showProfiles && (
            <div
              style={{
                marginTop: 8,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                background: "#111",
                border: "1px solid #222",
                borderRadius: 8,
                padding: 10,
              }}
            >
              {profiles.map((p) => {
                const isSelected = selectedProfiles.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProfile(p.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: isSelected ? "1px solid #7C3AED" : "1px solid #222",
                      background: isSelected ? "rgba(124,58,237,0.08)" : "transparent",
                      cursor: "pointer",
                      color: "#eee",
                      textAlign: "left",
                      fontFamily: "Inter, sans-serif",
                      width: "100%",
                    }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        border: isSelected ? "2px solid #7C3AED" : "2px solid #444",
                        background: isSelected ? "#7C3AED" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {isSelected ? "\u2713" : ""}
                    </span>
                    <span style={{ fontSize: 16 }}>
                      {TYPE_ICONS[p.profile_type] || TYPE_ICONS.custom}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{p.title}</div>
                      {isSelected && (
                        <div style={{ fontSize: 11, color: "#666", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.content.slice(0, 50)}{p.content.length > 50 ? "..." : ""}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <button
        disabled={!canSubmit}
        onClick={() => {
          onSubmit(question.trim(), [...selectedProfiles]);
          setQuestion("");
        }}
        style={{
          padding: "12px 24px",
          borderRadius: 8,
          border: "none",
          background: canSubmit ? "#7C3AED" : "#333",
          color: canSubmit ? "#fff" : "#666",
          fontWeight: 600,
          fontSize: 15,
          cursor: canSubmit ? "pointer" : "default",
          transition: "all 0.15s",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
