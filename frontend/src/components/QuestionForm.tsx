import { type MutableRefObject, useEffect, useState } from "react";
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
  submitRef?: MutableRefObject<(() => void) | null>;
}

const PROMPT_IDEAS = [
  // Strategy
  { cat: "Strategy", text: "Should we build this capability in-house or acquire a company that already has it?" },
  { cat: "Strategy", text: "We're entering a new market with 3 established competitors. What's our best entry strategy?" },
  { cat: "Strategy", text: "Our industry is being disrupted by AI. How should we position ourselves for the next 5 years?" },
  { cat: "Strategy", text: "We have the option to be first-to-market with an imperfect product or wait 6 months for a polished launch. Which path?" },
  // Career
  { cat: "Career", text: "I've been offered a C-suite role at a smaller company vs. staying VP at a Fortune 500. What should I consider?" },
  { cat: "Career", text: "I'm 5-7 years from retirement. How do I build a meaningful post-career identity while still performing at my peak?" },
  { cat: "Career", text: "Should I leave my corporate career to start a company in a field I'm passionate about?" },
  // Investment
  { cat: "Investment", text: "I'm considering acquiring a small SaaS business doing $30K MRR. What due diligence framework should I use?" },
  { cat: "Investment", text: "How should I allocate my portfolio between safe income-generating assets and high-growth bets in my last decade before retirement?" },
  { cat: "Investment", text: "Is it smarter to build a portfolio of small digital businesses or invest that same capital in index funds?" },
  // Leadership
  { cat: "Leadership", text: "Two of my best people are in conflict and it's affecting the whole team. How do I resolve this without losing either?" },
  { cat: "Leadership", text: "I need to restructure my organization but I'm worried about losing key talent during the transition. What's the playbook?" },
  { cat: "Leadership", text: "How do I build a culture of innovation in a risk-averse, heavily regulated industry?" },
  // Personal
  { cat: "Personal", text: "I'm overcommitted — too many projects, family needs more time, health is slipping. How do I ruthlessly prioritize?" },
  { cat: "Personal", text: "I want to write a book about my industry expertise. Is it worth the time investment? How should I approach it?" },
  { cat: "Personal", text: "How do I have a difficult conversation with a family member about finances without damaging the relationship?" },
  // Product
  { cat: "Product", text: "We have 50 feature requests from customers. How do we decide what to build next?" },
  { cat: "Product", text: "Our product is technically superior but losing to a competitor with better marketing. What should we change?" },
  // Ethics
  { cat: "Ethics", text: "We discovered our product is being used in a way we didn't intend that's legal but ethically questionable. What do we do?" },
  { cat: "Ethics", text: "A competitor is spreading misinformation about our product. Do we respond publicly or stay above it?" },
];

export default function QuestionForm({ selectedCount, loading, onSubmit, profiles, submitRef }: Props) {
  const [question, setQuestion] = useState("");
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [showProfiles, setShowProfiles] = useState(false);
  const [showIdeas, setShowIdeas] = useState(false);

  const canSubmit = question.trim().length > 0 && selectedCount >= 1 && !loading;

  // Expose submit function via ref for keyboard shortcuts
  useEffect(() => {
    if (submitRef) {
      submitRef.current = () => {
        if (canSubmit) {
          onSubmit(question.trim(), [...selectedProfiles]);
          setQuestion("");
        }
      };
    }
  }, [submitRef, canSubmit, question, selectedProfiles, onSubmit]);

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
      <div style={{ position: "relative" }}>
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
        <span
          style={{
            position: "absolute",
            bottom: 8,
            right: 12,
            fontSize: 10,
            color: "#444",
            pointerEvents: "none",
          }}
        >
          {navigator.platform.includes("Mac") ? "\u2318" : "Ctrl"}+Enter to submit
        </span>
      </div>

      {/* Ideas button + dropdown */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowIdeas(!showIdeas)}
          style={{
            background: "none",
            border: "1px solid #333",
            borderRadius: 6,
            color: "#888",
            cursor: "pointer",
            fontSize: 12,
            padding: "6px 12px",
            fontFamily: "Inter, sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>💡</span>
          <span>Prompt Ideas</span>
          <span style={{ fontSize: 10, color: "#666" }}>{showIdeas ? "▲" : "▼"}</span>
        </button>

        {showIdeas && (
          <div
            style={{
              marginTop: 8,
              background: "#111",
              border: "1px solid #222",
              borderRadius: 8,
              padding: 8,
              maxHeight: 300,
              overflowY: "auto",
            }}
          >
            {Array.from(new Set(PROMPT_IDEAS.map((p) => p.cat))).map((cat) => (
              <div key={cat} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#7C3AED",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    padding: "4px 8px",
                    marginBottom: 2,
                  }}
                >
                  {cat}
                </div>
                {PROMPT_IDEAS.filter((p) => p.cat === cat).map((idea, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuestion(idea.text);
                      setShowIdeas(false);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      color: "#ccc",
                      fontSize: 13,
                      lineHeight: 1.5,
                      padding: "8px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontFamily: "Inter, sans-serif",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1a1a")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    {idea.text}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

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
