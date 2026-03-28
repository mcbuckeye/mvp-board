import { useEffect, useState } from "react";
import type { Advisor, Session, SessionSummary } from "./types";
import * as api from "./api";
import { useAuth } from "./AuthContext";
import { useIsMobile } from "./hooks/useMediaQuery";
import LoginPage from "./components/LoginPage";
import BoardRoster from "./components/BoardRoster";
import QuestionForm from "./components/QuestionForm";
import SessionView from "./components/SessionView";
import SessionHistory from "./components/SessionHistory";
import BottomDrawer from "./components/BottomDrawer";
import "./App.css";

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();

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
    return <LoginPage />;
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
  const [showHistory, setShowHistory] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState<"board" | "history" | null>(null);

  useEffect(() => {
    api.fetchAdvisors().then(setAdvisors);
    api.fetchSessions().then(setHistory);
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (question: string) => {
    setLoading(true);
    try {
      const session = await api.createSession(question, [...selected]);
      setCurrentSession(session);
      const updated = await api.fetchSessions();
      setHistory(updated);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = async (id: string) => {
    const session = await api.fetchSession(id);
    setCurrentSession(session);
    setShowHistory(false);
    setDrawerOpen(null);
  };

  const responseContent = (
    <>
      {loading && (
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

      {!loading && currentSession && <SessionView session={currentSession} />}

      {!loading && !currentSession && (
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
          <h1 className="mobile-header-title">MVP Board</h1>
          <div className="mobile-header-actions">
            <button
              className="mobile-header-btn"
              onClick={() => setDrawerOpen(drawerOpen === "board" ? null : "board")}
            >
              Board{selected.size > 0 ? ` (${selected.size})` : ""}
            </button>
            <button
              className="mobile-header-btn"
              onClick={() => setDrawerOpen(drawerOpen === "history" ? null : "history")}
            >
              History
            </button>
            <span className="mobile-user-name">{user.display_name}</span>
            <button className="mobile-header-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* Question form */}
        <div style={{ padding: "14px 14px 10px" }}>
          <QuestionForm
            selectedCount={selected.size}
            loading={loading}
            onSubmit={handleSubmit}
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

  // Desktop layout (unchanged)
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
            MVP Board
          </h1>
          <button
            onClick={() => setShowHistory(!showHistory)}
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
            {showHistory ? "Roster" : "History"}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {showHistory ? (
            <SessionHistory
              sessions={history}
              activeId={currentSession?.id ?? null}
              onSelect={handleSelectSession}
            />
          ) : (
            <BoardRoster advisors={advisors} selected={selected} onToggle={toggle} />
          )}
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
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 32px 32px" }}>
          {responseContent}
        </div>
      </div>
    </div>
  );
}
