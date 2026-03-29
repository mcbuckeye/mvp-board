import React from "react";
import type { AdvisorResponse, Session } from "../types";

/**
 * Simple markdown to HTML converter. Handles headers, bold, italic, lists, paragraphs.
 * No external dependencies.
 */
function markdownToHtml(text: string): string {
  // Process line by line to properly wrap lists
  const lines = text.split("\n");
  const result: string[] = [];
  let inOl = false;
  let inUl = false;

  for (const rawLine of lines) {
    let line = rawLine
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headers
    const h3Match = line.match(/^## (.+)$/);
    const h4Match = line.match(/^### (.+)$/);
    if (h4Match) {
      if (inOl) { result.push("</ol>"); inOl = false; }
      if (inUl) { result.push("</ul>"); inUl = false; }
      line = h4Match[1].replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
      result.push('<h4 style="margin:16px 0 8px;font-size:14px;font-weight:700;color:#ddd">' + line + "</h4>");
      continue;
    }
    if (h3Match) {
      if (inOl) { result.push("</ol>"); inOl = false; }
      if (inUl) { result.push("</ul>"); inUl = false; }
      line = h3Match[1].replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
      result.push('<h3 style="margin:20px 0 10px;font-size:16px;font-weight:700;color:#eee">' + line + "</h3>");
      continue;
    }

    // Numbered list
    const olMatch = rawLine.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (inUl) { result.push("</ul>"); inUl = false; }
      if (!inOl) { result.push('<ol style="margin:8px 0;padding-left:24px">'); inOl = true; }
      let content = olMatch[1].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      content = content.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
      content = content.replace(/\[([^\]]{4,})\](?!\()/g, '<span style="display:inline;background:rgba(124,58,237,0.15);color:#C4B5FD;font-size:12px;padding:1px 7px;border-radius:4px;font-weight:500;white-space:nowrap">$1</span>');
      result.push('<li style="margin:6px 0">' + content + "</li>");
      continue;
    }

    // Bullet list
    const ulMatch = rawLine.match(/^[-•]\s+(.+)$/);
    if (ulMatch) {
      if (inOl) { result.push("</ol>"); inOl = false; }
      if (!inUl) { result.push('<ul style="margin:8px 0;padding-left:24px">'); inUl = true; }
      let content = ulMatch[1].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      content = content.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
      content = content.replace(/\[([^\]]{4,})\](?!\()/g, '<span style="display:inline;background:rgba(124,58,237,0.15);color:#C4B5FD;font-size:12px;padding:1px 7px;border-radius:4px;font-weight:500;white-space:nowrap">$1</span>');
      result.push('<li style="margin:6px 0">' + content + "</li>");
      continue;
    }

    // Close any open lists on non-list lines
    if (inOl) { result.push("</ol>"); inOl = false; }
    if (inUl) { result.push("</ul>"); inUl = false; }

    // Empty line = paragraph break
    if (line.trim() === "") {
      result.push('<div style="height:12px"></div>');
      continue;
    }

    // Regular text with inline formatting
    line = line.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#eee">$1</strong>');
    line = line.replace(/\*(.+?)\*/g, "<em>$1</em>");
    line = line.replace(/\[([^\]]{4,})\](?!\()/g, '<span style="display:inline;background:rgba(124,58,237,0.15);color:#C4B5FD;font-size:12px;padding:1px 7px;border-radius:4px;font-weight:500;white-space:nowrap">$1</span>');
    result.push('<p style="margin:4px 0">' + line + "</p>");
  }

  if (inOl) result.push("</ol>");
  if (inUl) result.push("</ul>");

  return result.join("\n");
}

/**
 * Render markdown text as formatted HTML with citations styled as inline badges.
 */
function renderMarkdown(text: string): JSX.Element {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: markdownToHtml(text) }}
      style={{ lineHeight: 1.7 }}
    />
  );
}

/* Legacy citation renderer kept for reference */
function renderWithCitations(text: string): (string | JSX.Element)[] {
  const parts = text.split(/(\[[^\]]{4,}\])(?!\()/g);
  return parts.map((part, i) => {
    if (part.startsWith("[") && part.endsWith("]") && part.length > 5) {
      const citation = part.slice(1, -1);
      return (
        <span
          key={i}
          style={{
            display: "inline",
            background: "rgba(124, 58, 237, 0.15)",
            color: "#C4B5FD",
            fontSize: 12,
            padding: "1px 7px",
            borderRadius: 4,
            fontWeight: 500,
            letterSpacing: 0.2,
            whiteSpace: "nowrap",
          }}
          title={citation}
        >
          {citation}
        </span>
      );
    }
    return part;
  });
}

interface Props {
  session: Session;
  onDeliberate?: () => void;
  onConsensus?: () => void;
  onStar?: (advisorId: string) => void;
  deliberating?: boolean;
  generatingConsensus?: boolean;
}

function ResponseCard({
  r,
  visible,
  isDeliberation,
  isModerator,
  isStarred,
  onStar,
}: {
  r: AdvisorResponse;
  visible: boolean;
  isDeliberation: boolean;
  isModerator: boolean;
  isStarred: boolean;
  onStar?: () => void;
}) {
  const bg = isModerator ? "#1a1708" : isDeliberation ? "#12121e" : "#141414";
  const borderColor = r.color;

  return (
    <div
      style={{
        padding: "16px 20px",
        background: bg,
        borderRadius: 10,
        borderLeft: `4px solid ${borderColor}`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: r.color,
            flexShrink: 0,
          }}
        />
        <span style={{ fontWeight: 600, color: r.color, fontSize: 14 }}>
          {r.name}
        </span>
        <span style={{ fontSize: 12, color: "#666" }}>{r.domain}</span>
        {isDeliberation && !isModerator && (
          <span
            style={{
              fontSize: 10,
              color: "#7C3AED",
              background: "#1a1a2e",
              padding: "2px 8px",
              borderRadius: 10,
              fontWeight: 500,
            }}
          >
            Debate
          </span>
        )}
        {isModerator && (
          <span
            style={{
              fontSize: 10,
              color: "#D97706",
              background: "#1a1708",
              border: "1px solid #D97706",
              padding: "2px 8px",
              borderRadius: 10,
              fontWeight: 600,
            }}
          >
            Consensus Report
          </span>
        )}
        {isStarred && (
          <span
            style={{
              fontSize: 10,
              color: "#F59E0B",
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.3)",
              padding: "2px 8px",
              borderRadius: 10,
              fontWeight: 600,
            }}
          >
            Most Valuable
          </span>
        )}
        {/* Star button — only for round 1, non-moderator */}
        {!isModerator && onStar && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStar();
            }}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              padding: "2px 4px",
              opacity: isStarred ? 1 : 0.4,
              transition: "opacity 0.15s",
              filter: isStarred ? "none" : "grayscale(1)",
            }}
            title={isStarred ? "Remove star" : "Star this response"}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = isStarred ? "1" : "0.4")}
          >
            {"\u{1F44D}"}
          </button>
        )}
      </div>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.7,
          color: "#ccc",
        }}
      >
        {renderMarkdown(r.response)}
      </div>
    </div>
  );
}

function RoundSeparator({ round }: { round: number }) {
  const label =
    round === 1
      ? "Initial Responses"
      : `Round ${round}: The Debate`;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        margin: "20px 0 8px",
      }}
    >
      <div style={{ flex: 1, height: 1, background: round === 1 ? "transparent" : "#2a2a3a" }} />
      {round > 1 && (
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#7C3AED",
            letterSpacing: 1,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      )}
      {round > 1 && <div style={{ flex: 1, height: 1, background: "#2a2a3a" }} />}
    </div>
  );
}

export default function SessionView({
  session,
  onDeliberate,
  onConsensus,
  onStar,
  deliberating,
  generatingConsensus,
}: Props) {
  const allResponses = session.responses;

  // Group by round
  const rounds = new Map<number, AdvisorResponse[]>();
  for (const r of allResponses) {
    const rnd = r.round ?? 1;
    if (!rounds.has(rnd)) rounds.set(rnd, []);
    rounds.get(rnd)!.push(r);
  }

  // Separate consensus (moderator) responses
  const hasConsensus = session.has_consensus;
  const consensusResponses: AdvisorResponse[] = [];
  const regularRounds = new Map<number, AdvisorResponse[]>();
  for (const [rnd, responses] of rounds) {
    const mods = responses.filter((r) => r.advisor_id === "moderator");
    const regs = responses.filter((r) => r.advisor_id !== "moderator");
    if (mods.length > 0) consensusResponses.push(...mods);
    if (regs.length > 0) regularRounds.set(rnd, regs);
  }
  const sortedRegularRounds = [...regularRounds.keys()].sort((a, b) => a - b);

  // Flat list for staggered reveal (regular + consensus at the end)
  const flatList: { r: AdvisorResponse; round: number }[] = [];
  for (const rnd of sortedRegularRounds) {
    for (const r of regularRounds.get(rnd)!) {
      flatList.push({ r, round: rnd });
    }
  }
  for (const r of consensusResponses) {
    flatList.push({ r, round: -1 }); // -1 = consensus
  }

  // All responses are always visible — streaming handles its own progressive reveal

  const maxNonModeratorRound = Math.max(
    ...allResponses.filter((r) => r.advisor_id !== "moderator").map((r) => r.round ?? 1),
    1
  );
  const canDeliberate = !hasConsensus && maxNonModeratorRound < 4;
  const canConsensus = maxNonModeratorRound >= 2 && !hasConsensus;

  // Build renderable sections
  let itemIndex = 0;
  const sections: JSX.Element[] = [];

  for (const rnd of sortedRegularRounds) {
    const responses = regularRounds.get(rnd)!;
    sections.push(<RoundSeparator key={`sep-${rnd}`} round={rnd} />);
    for (const r of responses) {
      const idx = itemIndex;
      itemIndex++;
      const isStarred = session.starred_advisor_id === r.advisor_id;
      sections.push(
        <ResponseCard
          key={`${r.advisor_id}-${rnd}-${idx}`}
          r={r}
          visible={true}
          isDeliberation={rnd > 1}
          isModerator={false}
          isStarred={isStarred}
          onStar={onStar ? () => onStar(r.advisor_id) : undefined}
        />
      );
    }
  }

  // Consensus
  if (consensusResponses.length > 0) {
    sections.push(
      <div
        key="consensus-sep"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "24px 0 8px",
        }}
      >
        <div style={{ flex: 1, height: 1, background: "#3d3000" }} />
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#D97706",
            letterSpacing: 1,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          Board Consensus
        </span>
        <div style={{ flex: 1, height: 1, background: "#3d3000" }} />
      </div>
    );
    for (const r of consensusResponses) {
      const idx = itemIndex;
      itemIndex++;
      sections.push(
        <ResponseCard
          key={`moderator-${idx}`}
          r={r}
          visible={true}
          isDeliberation={false}
          isModerator={true}
          isStarred={false}
        />
      );
    }
  }

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

      {sections}

      {/* Deliberation loading state */}
      {deliberating && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "8px 0",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "#2a2a3a" }} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#7C3AED",
                letterSpacing: 1,
                textTransform: "uppercase",
                animation: "pulse 1.5s infinite",
              }}
            >
              The board is debating...
            </span>
            <div style={{ flex: 1, height: 1, background: "#2a2a3a" }} />
          </div>
          {session.responses
            .filter((r) => r.round === maxNonModeratorRound && r.advisor_id !== "moderator")
            .map((r) => (
              <div
                key={`delib-loading-${r.advisor_id}`}
                style={{
                  padding: "16px 20px",
                  background: "#12121e",
                  borderRadius: 10,
                  borderLeft: `4px solid ${r.color}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: r.color,
                      animation: "pulse 1.5s infinite",
                    }}
                  />
                  <span style={{ color: r.color, fontWeight: 600, fontSize: 14 }}>
                    {r.name}
                  </span>
                  <span style={{ color: "#555", fontSize: 13, fontStyle: "italic" }}>
                    is formulating a rebuttal...
                  </span>
                </div>
              </div>
            ))}
          <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }`}</style>
        </div>
      )}

      {/* Consensus loading state */}
      {generatingConsensus && (
        <div style={{ padding: "16px 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ flex: 1, height: 1, background: "#3d3000" }} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#D97706",
                letterSpacing: 1,
                textTransform: "uppercase",
                animation: "pulse 1.5s infinite",
              }}
            >
              Generating consensus report...
            </span>
            <div style={{ flex: 1, height: 1, background: "#3d3000" }} />
          </div>
          <div
            style={{
              padding: "16px 20px",
              background: "#1a1708",
              borderRadius: 10,
              borderLeft: "4px solid #D97706",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#D97706",
                  animation: "pulse 1.5s infinite",
                }}
              />
              <span style={{ color: "#D97706", fontWeight: 600, fontSize: 14 }}>
                Board Moderator
              </span>
              <span style={{ color: "#555", fontSize: 13, fontStyle: "italic" }}>
                is synthesizing the debate...
              </span>
            </div>
          </div>
          <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }`}</style>
        </div>
      )}

      {/* Action buttons */}
      {!deliberating && !generatingConsensus && (canDeliberate || canConsensus) && (
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            padding: "12px 0",
            flexWrap: "wrap",
          }}
        >
          {canDeliberate && (
            <button
              onClick={onDeliberate}
              style={{
                padding: "12px 28px",
                background: "linear-gradient(135deg, #7C3AED, #9333EA)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                minWidth: 180,
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,58,237,0.4)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {maxNonModeratorRound === 1 ? "Let Them Debate" : "Continue Debate"}
            </button>
          )}
          {canConsensus && (
            <button
              onClick={onConsensus}
              style={{
                padding: "12px 28px",
                background: "linear-gradient(135deg, #92400E, #D97706)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                minWidth: 180,
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(217,119,6,0.4)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Generate Consensus
            </button>
          )}
        </div>
      )}
    </div>
  );
}
