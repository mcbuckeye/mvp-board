import { useState } from "react";
import type { Advisor, BoardPreset } from "../types";

interface Props {
  presets: BoardPreset[];
  advisors: Advisor[];
  selected: Set<string>;
  onApplyPreset: (advisorIds: string[]) => void;
  onSavePreset: (name: string, description: string) => void;
  onDeletePreset: (id: string) => void;
}

export default function PresetSection({
  presets,
  advisors,
  selected,
  onApplyPreset,
  onSavePreset,
  onDeletePreset,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const advisorMap = new Map(advisors.map((a) => [a.id, a]));

  const handleSave = () => {
    if (!name.trim() || selected.size === 0) return;
    onSavePreset(name.trim(), description.trim());
    setName("");
    setDescription("");
    setSaving(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "12px 12px 8px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <h2
          style={{
            fontSize: 14,
            color: "#888",
            margin: 0,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Presets
        </h2>
        {selected.size > 0 && !saving && (
          <button
            onClick={() => setSaving(true)}
            style={{
              background: "none",
              border: "1px solid #333",
              borderRadius: 4,
              color: "#A78BFA",
              cursor: "pointer",
              fontSize: 10,
              padding: "2px 8px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Save Selection
          </button>
        )}
      </div>

      {/* Save preset form */}
      {saving && (
        <div
          style={{
            padding: 10,
            background: "#1a1a2e",
            borderRadius: 8,
            border: "1px solid #2a2a3a",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Preset name..."
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #333",
              background: "#111",
              color: "#eee",
              fontSize: 12,
              fontFamily: "Inter, sans-serif",
              outline: "none",
            }}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #333",
              background: "#111",
              color: "#eee",
              fontSize: 12,
              fontFamily: "Inter, sans-serif",
              outline: "none",
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              style={{
                flex: 1,
                padding: "5px 10px",
                borderRadius: 6,
                border: "none",
                background: name.trim() ? "#7C3AED" : "#333",
                color: name.trim() ? "#fff" : "#666",
                fontSize: 11,
                fontWeight: 600,
                cursor: name.trim() ? "pointer" : "default",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Save ({selected.size} advisors)
            </button>
            <button
              onClick={() => setSaving(false)}
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                border: "1px solid #333",
                background: "transparent",
                color: "#888",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Preset cards */}
      {presets.map((preset) => {
        const previewNames = preset.advisor_ids
          .slice(0, 3)
          .map((id) => advisorMap.get(id)?.name || id)
          .join(", ");
        const moreCount = preset.advisor_ids.length - 3;

        return (
          <div
            key={preset.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #222",
              background: "#1a1a1a",
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
            onClick={() => onApplyPreset(preset.advisor_ids)}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = preset.color)}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = "#222")}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: preset.color,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#eee" }}>
                {preset.name}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#666",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {previewNames}
                {moreCount > 0 ? ` +${moreCount}` : ""}
              </div>
            </div>
            <span style={{ fontSize: 10, color: "#555", flexShrink: 0 }}>
              {preset.advisor_ids.length}
            </span>
            {!preset.is_system && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePreset(preset.id);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#555",
                  cursor: "pointer",
                  fontSize: 14,
                  padding: "0 2px",
                  lineHeight: 1,
                }}
                title="Delete preset"
              >
                &times;
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
