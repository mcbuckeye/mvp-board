import { useCallback, useEffect, useRef, useState } from "react";
import type { Advisor, AdvisorResponse, BoardPreset, Session, SessionSummary, UserProfile } from "./types";
import * as api from "./api";
import { useAuth } from "./AuthContext";
import { useIsMobile } from "./hooks/useMediaQuery";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import BoardRoster from "./components/BoardRoster";
import PresetSection from "./components/PresetSection";
import QuestionForm from "./components/QuestionForm";
import SessionView from "./components/SessionView";
import SessionHistory from "./components/SessionHistory";
import BottomDrawer from "./components/BottomDrawer";
import ProfilesPage from "./components/ProfilesPage";
import "./App.css";

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const [authView, setAuthView] = useState<"landing" | "login" | "register">("landing");

  if (authLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#0d0d0d",
          color: "#666",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!user) {
    if (authView === "login" || authView === "register") {
      return (
        <LoginPage
          defaultRegister={authView === "register"}
          onBack={() => setAuthView("landing")}
        />
      );
    }
    return (
      <LandingPage
        onSignIn={() => setAuthView("login")}
        onStartTrial={() => setAuthView("register")}
      />
    );
  }

  return <Board user={user} onLogout={logout} />;
}

function Board({
  user,
  onLogout,
}: {
  user: { id: string; email: string; display_name: string };
  onLogout: () => void;
}) {
  const isMobile = useIsMobile();
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [history, setHistory] = useState<SessionSummary[]>([]);
  const [sidebarView, setSidebarView] = useState<"roster" | "history">("roster");
  const [drawerOpen, setDrawerOpen] = useState<"board" | "history" | null>(null);
  const [deliberating, setDeliberating] = useState(false);
  const [generatingConsensus, setGeneratingConsensus] = useState(false);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [view, setView] = useState<"board" | "profiles">("board");
  const [presets, setPresets] = useState<BoardPreset[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Streaming state
  const [streamingResponses, setStreamingResponses] = useState<AdvisorResponse[]>([]);
  const [streamingQuestion, setStreamingQuestion] = useState<string>("");
  const [streamingTotal, setStreamingTotal] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);

  // Ref for question form submission via keyboard
  const submitRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    api.fetchAdvisors().then(setAdvisors);
    api.fetchSessions().then(setHistory);
    api.fetchProfiles().then(setProfiles);
    api.fetchPresets().then(setPresets);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea (except Cmd+Enter)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      // Cmd/Ctrl+Enter to submit
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        submitRef.current?.();
        return;
      }

      // Number keys to toggle advisors (only when not in an input)
      if (isInput) return;
      const keyMap: Record<string, number> = {
        "1": 0, "2": 1, "3": 2, "4": 3, "5": 4,
        "6": 5, "7": 6, "8": 7, "9": 8, "0": 9, "-": 10,
      };
      if (e.key in keyMap && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const idx = keyMap[e.key];
        if (idx < advisors.length) {
          e.preventDefault();
          toggle(advisors[idx].id);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [advisors]);

  const refreshProfiles = () => {
    api.fetchProfiles().then(setProfiles);
  };

  const refreshPresets = () => {
    api.fetchPresets().then(setPresets);
  };

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleApplyPreset = (advisorIds: string[]) => {
    setSelected(new Set(advisorIds));
  };

  const handleSavePreset = async (name: string, description: string) => {
    await api.createPreset({
      name,
      description: description || undefined,
      advisor_ids: [...selected],
    });
    refreshPresets();
  };

  const handleDeletePreset = async (id: string) => {
    await api.deletePreset(id);
    refreshPresets();
  };

  const handleSubmit = async (question: string, profileIds: string[]) => {
    setLoading(true);
    setError(null);
    setStreamingResponses([]);
    setStreamingQuestion(question);
    setStreamingTotal(selected.size);
    setIsStreaming(true);
    setCurrentSession(null);

    try {
      await api.createSessionStreaming(
        question,
        [...selected],
        profileIds.length > 0 ? profileIds : undefined,
        // onResponse — each advisor arrives
        (response) => {
          setStreamingResponses((prev) => [...prev, { ...response, round: 1 }]);
        },
        // onComplete — all done
        async (sessionId) => {
          setIsStreaming(false);
          setLoading(false);
          // Fetch the full session from DB
          const session = await api.fetchSession(sessionId);
          setCurrentSession(session);
          setStreamingResponses([]);
          const updated = await api.fetchSessions();
          setHistory(updated);
        },
        // onError
        (errMsg) => {
          setIsStreaming(false);
          setLoading(false);
          setError(errMsg);
        }
      );
    } catch (e: any) {
      setIsStreaming(false);
      setLoading(false);
      setError(
        e?.message === "Failed to fetch"
          ? "Request timed out — try fewer advisors or a shorter question."
          : `Error: ${e?.message || "Something went wrong. Please try again."}`
      );
    }
  };

  const handleSelectSession = async (id: string) => {
    const session = await api.fetchSession(id);
    setCurrentSession(session);
    setSidebarView("roster");
    setDrawerOpen(null);
  };

  const handleDeliberate = async () => {
    if (!currentSession) return;
    setDeliberating(true);
    setError(null);
    try {
      const updated = await api.deliberate(currentSession.id);
      setCurrentSession(updated);
    } catch (e: any) {
      setError(e?.message || "Deliberation failed");
    } finally {
      setDeliberating(false);
    }
  };

  const handleConsensus = async () => {
    if (!currentSession) return;
    setGeneratingConsensus(true);
    setError(null);
    try {
      const updated = await api.generateConsensus(currentSession.id);
      setCurrentSession(updated);
    } catch (e: any) {
      setError(e?.message || "Consensus generation failed");
    } finally {
      setGeneratingConsensus(false);
    }
  };

  const handleStar = async (advisorId: string) => {
    if (!currentSession) return;
    const newStarred = currentSession.starred_advisor_id === advisorId ? null : advisorId;
    await api.starAdvisor(currentSession.id, newStarred);
    setCurrentSession({ ...currentSession, starred_advisor_id: newStarred });
  };

  // Profiles view
  if (view === "profiles") {
    return (
      <div
        style={{
          height: "100vh",
          background: "#0d0d0d",
          color: "#eee",
          fontFamily: "'Inter', sans-serif",
          overflowY: "auto",
        }}
      >
        <ProfilesPage
          onBack={() => {
            refreshProfiles();
            setView("board");
          }}
        />
      </div>
    );
  }

  // Streaming loading state — show responses as they arrive
  const streamingContent = isStreaming && (
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
        <div style={{ fontSize: 15, color: "#eee" }}>{streamingQuestion}</div>
      </div>

      {/* Progress indicator */}
      <div
        style={{
          fontSize: 13,
          color: "#A78BFA",
          textAlign: "center",
          padding: "4px 0",
        }}
      >
        {streamingResponses.length} of {streamingTotal} advisors have responded...
      </div>

      {/* Arrived responses */}
      {streamingResponses.map((r, i) => (
        <div
          key={`stream-${r.advisor_id}-${i}`}
          style={{
            padding: "16px 20px",
            background: "#141414",
            borderRadius: 10,
            borderLeft: `4px solid ${r.color}`,
            animation: "fadeSlideIn 0.4s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: r.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontWeight: 600, color: r.color, fontSize: 14 }}>{r.name}</span>
            <span style={{ fontSize: 12, color: "#666" }}>{r.domain}</span>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "#ccc", whiteSpace: "pre-wrap" }}>
            {r.response}
          </div>
        </div>
      ))}

      {/* Remaining advisors still deliberating */}
      {[...selected]
        .filter((id) => !streamingResponses.some((r) => r.advisor_id === id))
        .map((id) => {
          const a = advisors.find((x) => x.id === id);
          return (
            <div
              key={`waiting-${id}`}
              style={{
                padding: "16px 20px",
                background: "#141414",
                borderRadius: 10,
                borderLeft: `4px solid ${a?.color ?? "#555"}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: a?.color ?? "#555",
                    animation: "pulse 1.5s infinite",
                  }}
                />
                <span style={{ color: a?.color ?? "#888", fontWeight: 600, fontSize: 14 }}>
                  {a?.name ?? id}
                </span>
                <span style={{ color: "#555", fontSize: 13, fontStyle: "italic" }}>
                  is deliberating...
                </span>
              </div>
            </div>
          );
        })}
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  );

  const responseContent = (
    <>
      {/* Non-streaming loading (fallback) */}
      {loading && !isStreaming && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: "24px 0",
          }}
        >
          {[...selected].map((id) => {
            const a = advisors.find((x) => x.id === id);
            return (
              <div
                key={id}
                style={{
                  padding: "16px 20px",
                  background: "#141414",
                  borderRadius: 10,
                  borderLeft: `4px solid ${a?.color ?? "#555"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: a?.color ?? "#555",
                      animation: "pulse 1.5s infinite",
                    }}
                  />
                  <span style={{ color: a?.color ?? "#888", fontWeight: 600, fontSize: 14 }}>
                    {a?.name ?? id}
                  </span>
                  <span style={{ color: "#555", fontSize: 13, fontStyle: "italic" }}>
                    is deliberating...
                  </span>
                </div>
              </div>
            );
          })}
          <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }`}</style>
        </div>
      )}

      {streamingContent}

      {error && (
        <div
          style={{
            padding: "14px 20px",
            background: "#2a1515",
            border: "1px solid #6b2c2c",
            borderRadius: 8,
            color: "#f87171",
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {!loading && !isStreaming && currentSession && (
        <SessionView
          session={currentSession}
          onDeliberate={handleDeliberate}
          onConsensus={handleConsensus}
          onStar={handleStar}
          deliberating={deliberating}
          generatingConsensus={generatingConsensus}
        />
      )}

      {!loading && !isStreaming && !currentSession && !error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "#444",
            fontSize: 15,
          }}
        >
          Select board members and ask your question.
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          background: "#0d0d0d",
          color: "#eee",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Mobile header bar */}
        <div className="mobile-header" style={{ display: "flex" }}>
          <h1 className="mobile-header-title">ConveneAgent</h1>
          <div className="mobile-header-actions">
            <button
              className="mobile-header-btn"
              onClick={() => setDrawerOpen(drawerOpen === "board" ? null : "board")}
            >
              Board{selected.size > 0 ? ` (${selected.size})` : ""}
            </button>
            <button
              className="mobile-header-btn mobile-hamburger"
              onClick={() => setDrawerOpen(drawerOpen === "menu" ? null : "menu")}
              aria-label="Menu"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {drawerOpen === "menu" && (
          <div className="mobile-menu-dropdown">
            <button className="mobile-menu-item" onClick={() => { setView("profiles"); setDrawerOpen(null); }}>
              📋 My Profiles
            </button>
            <button className="mobile-menu-item" onClick={() => { setDrawerOpen("history"); }}>
              📜 History
            </button>
            <div className="mobile-menu-divider" />
            <div className="mobile-menu-user">{user.display_name}</div>
            <button className="mobile-menu-item mobile-menu-logout" onClick={onLogout}>
              Logout
            </button>
          </div>
        )}

        {/* Question form */}
        <div style={{ padding: "14px 14px 10px" }}>
          <QuestionForm
            selectedCount={selected.size}
            loading={loading}
            onSubmit={handleSubmit}
            profiles={profiles}
            submitRef={submitRef}
          />
        </div>

        {/* Responses */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 14px 14px" }}>
          {responseContent}
        </div>

        {/* Bottom drawers */}
        <BottomDrawer
          open={drawerOpen === "board"}
          title="Board Members"
          onClose={() => setDrawerOpen(null)}
        >
          <PresetSection
            presets={presets}
            advisors={advisors}
            selected={selected}
            onApplyPreset={handleApplyPreset}
            onSavePreset={handleSavePreset}
            onDeletePreset={handleDeletePreset}
          />
          <BoardRoster advisors={advisors} selected={selected} onToggle={toggle} />
        </BottomDrawer>

        <BottomDrawer
          open={drawerOpen === "history"}
          title="Session History"
          onClose={() => setDrawerOpen(null)}
        >
          <SessionHistory
            sessions={history}
            activeId={currentSession?.id ?? null}
            onSelect={handleSelectSession}
          />
        </BottomDrawer>
      </div>
    );
  }

  // Desktop layout
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#0d0d0d",
        color: "#eee",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Left sidebar */}
      <div
        style={{
          width: 240,
          flexShrink: 0,
          background: "#111",
          borderRight: "1px solid #222",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 14px 12px",
            borderBottom: "1px solid #222",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#A78BFA" }}>
            ConveneAgent
          </h1>
          <button
            onClick={() => setSidebarView(sidebarView === "history" ? "roster" : "history")}
            style={{
              background: "none",
              border: "1px solid #333",
              borderRadius: 4,
              color: "#888",
              cursor: "pointer",
              fontSize: 11,
              padding: "3px 8px",
            }}
          >
            {sidebarView === "history" ? "Roster" : "History"}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {sidebarView === "history" ? (
            <SessionHistory
              sessions={history}
              activeId={currentSession?.id ?? null}
              onSelect={handleSelectSession}
            />
          ) : (
            <>
              <BoardRoster advisors={advisors} selected={selected} onToggle={toggle} />
              <div style={{ borderTop: "1px solid #222" }}>
                <PresetSection
                  presets={presets}
                  advisors={advisors}
                  selected={selected}
                  onApplyPreset={handleApplyPreset}
                  onSavePreset={handleSavePreset}
                  onDeletePreset={handleDeletePreset}
                />
              </div>
            </>
          )}
        </div>

        {/* Profiles button */}
        <div
          style={{
            padding: "8px 14px",
            borderTop: "1px solid #222",
          }}
        >
          <button
            onClick={() => setView("profiles")}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #333",
              background: "transparent",
              color: "#A78BFA",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "center",
              transition: "border-color 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = "#7C3AED")}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = "#333")}
          >
            <span style={{ fontSize: 14 }}>{"\u{1F464}"}</span> My Profiles
            {profiles.length > 0 && (
              <span
                style={{
                  fontSize: 10,
                  background: "rgba(124,58,237,0.15)",
                  padding: "1px 6px",
                  borderRadius: 8,
                  color: "#A78BFA",
                }}
              >
                {profiles.length}
              </span>
            )}
          </button>
        </div>

        {/* User footer */}
        <div
          style={{
            padding: "10px 14px",
            borderTop: "1px solid #222",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 12, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.display_name}
          </span>
          <button
            onClick={onLogout}
            style={{
              background: "none",
              border: "1px solid #333",
              borderRadius: 4,
              color: "#888",
              cursor: "pointer",
              fontSize: 11,
              padding: "3px 8px",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "24px 32px 16px" }}>
          <QuestionForm
            selectedCount={selected.size}
            loading={loading}
            onSubmit={handleSubmit}
            profiles={profiles}
            submitRef={submitRef}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 32px 32px" }}>
          {responseContent}
        </div>
      </div>
    </div>
  );
}
