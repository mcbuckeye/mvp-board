import { useEffect, useState } from "react";
import type { UserProfile, ProfileTemplate } from "../types";
import * as api from "../api";

const TYPE_ICONS: Record<string, string> = {
  professional: "\u{1F4BC}",
  financial: "\u{1F4B0}",
  personal: "\u{1F464}",
  technical: "\u{1F527}",
  entrepreneurial: "\u{1F680}",
  health: "\u{2764}\uFE0F",
  custom: "\u{1F4DD}",
};

function typeIcon(t: string) {
  return TYPE_ICONS[t] || TYPE_ICONS.custom;
}

interface Props {
  onBack: () => void;
}

export default function ProfilesPage({ onBack }: Props) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [templates, setTemplates] = useState<Record<string, ProfileTemplate>>({});
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState("professional");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    api.fetchProfiles().then(setProfiles);
    api.fetchProfileTemplates().then(setTemplates);
  }, []);

  const handleCreate = async () => {
    const profile = await api.createProfile({
      profile_type: newType,
      title: newTitle || templates[newType]?.title || "New Profile",
      content: newContent,
    });
    setProfiles((prev) => [...prev, profile]);
    setCreating(false);
    setNewType("professional");
    setNewTitle("");
    setNewContent("");
  };

  const handleUpdate = async () => {
    if (!editing) return;
    const updated = await api.updateProfile(editing.id, {
      title: editTitle,
      content: editContent,
    });
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    await api.deleteProfile(id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    setConfirmDelete(null);
  };

  const startEdit = (p: UserProfile) => {
    setEditing(p);
    setEditTitle(p.title);
    setEditContent(p.content);
    setCreating(false);
  };

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setNewType("professional");
    setNewTitle("");
    setNewContent(templates["professional"]?.content || "");
  };

  const templateTypes = Object.keys(templates);

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "24px 16px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "1px solid #333",
            borderRadius: 6,
            color: "#888",
            cursor: "pointer",
            fontSize: 13,
            padding: "6px 12px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          &larr; Back
        </button>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#A78BFA" }}>
          My Profiles
        </h2>
      </div>

      <p style={{ color: "#888", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
        Create profiles for different life domains. Attach them to board sessions so advisors understand your context.
      </p>

      {/* Profile cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {profiles.map((p) => (
          <div
            key={p.id}
            style={{
              background: "#141414",
              border: "1px solid #222",
              borderRadius: 10,
              padding: "16px 20px",
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}
            onClick={() => startEdit(p)}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = "#444")}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = "#222")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{typeIcon(p.profile_type)}</span>
              <span style={{ fontWeight: 600, fontSize: 15, color: "#eee" }}>{p.title}</span>
              <span
                style={{
                  fontSize: 11,
                  color: "#7C3AED",
                  background: "rgba(124,58,237,0.1)",
                  padding: "2px 8px",
                  borderRadius: 8,
                  fontWeight: 500,
                  textTransform: "capitalize",
                }}
              >
                {p.profile_type}
              </span>
            </div>
            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.5 }}>
              {p.content.slice(0, 120)}
              {p.content.length > 120 ? "..." : ""}
            </div>
          </div>
        ))}

        {profiles.length === 0 && !creating && (
          <div style={{ color: "#555", fontSize: 14, padding: "20px 0", textAlign: "center" }}>
            No profiles yet. Create one to give your board context about you.
          </div>
        )}
      </div>

      {/* Add profile button */}
      {!creating && !editing && (
        <button
          onClick={startCreate}
          style={{
            padding: "12px 24px",
            borderRadius: 8,
            border: "2px dashed #333",
            background: "transparent",
            color: "#A78BFA",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            width: "100%",
            fontFamily: "Inter, sans-serif",
            transition: "border-color 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = "#7C3AED")}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = "#333")}
        >
          + Add Profile
        </button>
      )}

      {/* Create form */}
      {creating && (
        <div
          style={{
            background: "#141414",
            border: "1px solid #333",
            borderRadius: 10,
            padding: 20,
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "#eee" }}>
            New Profile
          </h3>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>
              Profile Type
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {templateTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setNewType(t);
                    setNewTitle(templates[t]?.title || "");
                    setNewContent(templates[t]?.content || "");
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: newType === t ? "2px solid #7C3AED" : "1px solid #333",
                    background: newType === t ? "rgba(124,58,237,0.1)" : "#1a1a1a",
                    color: newType === t ? "#A78BFA" : "#888",
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "Inter, sans-serif",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {typeIcon(t)} {templates[t]?.title || t}
                </button>
              ))}
              <button
                onClick={() => {
                  setNewType("custom");
                  setNewTitle("");
                  setNewContent("");
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: newType === "custom" ? "2px solid #7C3AED" : "1px solid #333",
                  background: newType === "custom" ? "rgba(124,58,237,0.1)" : "#1a1a1a",
                  color: newType === "custom" ? "#A78BFA" : "#888",
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "Inter, sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {typeIcon("custom")} Custom
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>
              Title
            </label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Professional Background"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>
              Content
            </label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={8}
              placeholder="Describe your background, goals, and context..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleCreate} style={btnPrimary}>
              Save Profile
            </button>
            <button
              onClick={() => setCreating(false)}
              style={btnSecondary}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div
          style={{
            background: "#141414",
            border: "1px solid #333",
            borderRadius: 10,
            padding: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#eee", display: "flex", alignItems: "center", gap: 8 }}>
              <span>{typeIcon(editing.profile_type)}</span> Edit Profile
            </h3>
            {confirmDelete === editing.id ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#f87171" }}>Delete?</span>
                <button onClick={() => handleDelete(editing.id)} style={{ ...btnSecondary, color: "#f87171", borderColor: "#6b2c2c", fontSize: 12, padding: "4px 10px" }}>
                  Yes
                </button>
                <button onClick={() => setConfirmDelete(null)} style={{ ...btnSecondary, fontSize: 12, padding: "4px 10px" }}>
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(editing.id)}
                style={{ ...btnSecondary, color: "#f87171", borderColor: "#6b2c2c", fontSize: 12, padding: "4px 10px" }}
              >
                Delete
              </button>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>
              Title
            </label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>
              Content
            </label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={10}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleUpdate} style={btnPrimary}>
              Save Changes
            </button>
            <button onClick={() => setEditing(null)} style={btnSecondary}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "#1a1a1a",
  color: "#eee",
  fontSize: 14,
  fontFamily: "Inter, sans-serif",
  outline: "none",
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 20px",
  borderRadius: 8,
  border: "none",
  background: "#7C3AED",
  color: "#fff",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "Inter, sans-serif",
};

const btnSecondary: React.CSSProperties = {
  padding: "10px 20px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "transparent",
  color: "#888",
  fontWeight: 500,
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "Inter, sans-serif",
};
