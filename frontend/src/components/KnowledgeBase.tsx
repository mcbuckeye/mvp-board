import { useEffect, useState } from "react";
import type { Advisor } from "../types";
import * as api from "../api";
import type { AdvisorDocumentSummary } from "../api";

interface Props {
  advisors: Advisor[];
  onBack: () => void;
}

const SOURCE_TYPES = [
  "quote_collection",
  "book",
  "speech",
  "interview",
  "letter",
  "article",
];

export default function KnowledgeBase({ advisors, onBack }: Props) {
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [documents, setDocuments] = useState<AdvisorDocumentSummary[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload form state
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceType, setSourceType] = useState("quote_collection");
  const [content, setContent] = useState("");

  useEffect(() => {
    api.fetchKnowledgeBaseSummary().then(setSummary);
  }, []);

  const selectAdvisor = async (advisor: Advisor) => {
    setSelectedAdvisor(advisor);
    setShowUpload(false);
    setError(null);
    setLoadingDocs(true);
    try {
      const docs = await api.fetchAdvisorDocuments(advisor.id);
      setDocuments(docs);
    } catch {
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedAdvisor || !title.trim() || !content.trim()) return;
    setUploading(true);
    setError(null);
    try {
      await api.uploadAdvisorDocument(selectedAdvisor.id, {
        title: title.trim(),
        content: content.trim(),
        source_url: sourceUrl.trim() || undefined,
        source_type: sourceType,
      });
      // Refresh
      const docs = await api.fetchAdvisorDocuments(selectedAdvisor.id);
      setDocuments(docs);
      const sum = await api.fetchKnowledgeBaseSummary();
      setSummary(sum);
      // Reset form
      setTitle("");
      setSourceUrl("");
      setSourceType("quote_collection");
      setContent("");
      setShowUpload(false);
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: AdvisorDocumentSummary) => {
    if (!selectedAdvisor) return;
    await api.deleteAdvisorDocument(selectedAdvisor.id, doc.id);
    const docs = await api.fetchAdvisorDocuments(selectedAdvisor.id);
    setDocuments(docs);
    const sum = await api.fetchKnowledgeBaseSummary();
    setSummary(sum);
  };

  // Filter to default advisors (the ones from the backend defaults)
  const defaultAdvisorIds = [
    "jobs", "cuban", "nooyi", "mandela", "musk",
    "grove", "suntzu", "whitman", "oprah", "buffett", "buddha",
  ];
  const defaultAdvisors = advisors.filter((a) => defaultAdvisorIds.includes(a.id));
  const customAdvisors = advisors.filter((a) => !defaultAdvisorIds.includes(a.id));
  const allAdvisors = [...defaultAdvisors, ...customAdvisors];

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "32px 24px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "1px solid #333",
            borderRadius: 6,
            color: "#888",
            cursor: "pointer",
            padding: "6px 14px",
            fontSize: 13,
          }}
        >
          Back
        </button>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#A78BFA" }}>
          Knowledge Base
        </h2>
      </div>

      {selectedAdvisor ? (
        // ──── Advisor detail view ────
        <div>
          <button
            onClick={() => { setSelectedAdvisor(null); setShowUpload(false); }}
            style={{
              background: "none",
              border: "none",
              color: "#A78BFA",
              cursor: "pointer",
              fontSize: 13,
              padding: 0,
              marginBottom: 16,
            }}
          >
            &larr; All Advisors
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: selectedAdvisor.color,
                flexShrink: 0,
              }}
            />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: selectedAdvisor.color }}>
              {selectedAdvisor.name}
            </h3>
            <span style={{ fontSize: 13, color: "#666" }}>{selectedAdvisor.domain}</span>
          </div>

          {/* Upload button */}
          {!showUpload && (
            <button
              onClick={() => setShowUpload(true)}
              style={{
                padding: "8px 20px",
                background: "linear-gradient(135deg, #7C3AED, #9333EA)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: 16,
              }}
            >
              + Add Document
            </button>
          )}

          {/* Upload form */}
          {showUpload && (
            <div
              style={{
                background: "#1a1a2e",
                borderRadius: 10,
                padding: 20,
                marginBottom: 20,
                border: "1px solid #2a2a3a",
              }}
            >
              <h4 style={{ margin: "0 0 14px", color: "#ccc", fontSize: 15 }}>Add Document</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input
                  placeholder="Title (e.g., Berkshire 2023 Shareholder Letter)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    background: "#0d0d0d",
                    border: "1px solid #333",
                    borderRadius: 6,
                    color: "#eee",
                    fontSize: 14,
                    fontFamily: "Inter, sans-serif",
                  }}
                />
                <input
                  placeholder="Source URL (optional)"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    background: "#0d0d0d",
                    border: "1px solid #333",
                    borderRadius: 6,
                    color: "#eee",
                    fontSize: 14,
                    fontFamily: "Inter, sans-serif",
                  }}
                />
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    background: "#0d0d0d",
                    border: "1px solid #333",
                    borderRadius: 6,
                    color: "#eee",
                    fontSize: 14,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {SOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <textarea
                  placeholder="Paste document content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  style={{
                    padding: "10px 14px",
                    background: "#0d0d0d",
                    border: "1px solid #333",
                    borderRadius: 6,
                    color: "#eee",
                    fontSize: 14,
                    fontFamily: "Inter, sans-serif",
                    resize: "vertical",
                  }}
                />
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !title.trim() || !content.trim()}
                    style={{
                      padding: "10px 24px",
                      background: uploading ? "#555" : "linear-gradient(135deg, #7C3AED, #9333EA)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: uploading ? "wait" : "pointer",
                    }}
                  >
                    {uploading ? "Uploading & Embedding..." : "Upload & Embed"}
                  </button>
                  <button
                    onClick={() => setShowUpload(false)}
                    style={{
                      padding: "10px 20px",
                      background: "transparent",
                      color: "#888",
                      border: "1px solid #333",
                      borderRadius: 6,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
              {error && (
                <div style={{ color: "#f87171", fontSize: 13, marginTop: 10 }}>{error}</div>
              )}
            </div>
          )}

          {/* Documents list */}
          {loadingDocs ? (
            <div style={{ color: "#666", fontSize: 14, padding: "20px 0" }}>Loading documents...</div>
          ) : documents.length === 0 ? (
            <div style={{ color: "#555", fontSize: 14, padding: "20px 0" }}>
              No documents yet. Add source material to ground this advisor's responses.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    padding: "14px 18px",
                    background: "#141414",
                    borderRadius: 8,
                    borderLeft: `3px solid ${selectedAdvisor.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 600, color: "#ddd", fontSize: 14, marginBottom: 4 }}>
                      {doc.title}
                    </div>
                    <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#666" }}>
                      <span style={{
                        background: "#1a1a2e",
                        padding: "2px 8px",
                        borderRadius: 6,
                        color: "#A78BFA",
                      }}>
                        {doc.source_type.replace("_", " ")}
                      </span>
                      <span>{doc.chunk_count} chunks</span>
                      {doc.created_at && (
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc)}
                    style={{
                      background: "none",
                      border: "1px solid #3b1c1c",
                      borderRadius: 4,
                      color: "#f87171",
                      cursor: "pointer",
                      fontSize: 12,
                      padding: "4px 10px",
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // ──── Advisor grid ────
        <div>
          <p style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>
            Manage source material that grounds each advisor's responses. Documents are chunked,
            embedded, and retrieved via RAG to make responses authentic and citable.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: 12,
            }}
          >
            {allAdvisors.map((advisor) => {
              const docCount = summary[advisor.id] || 0;
              return (
                <button
                  key={advisor.id}
                  onClick={() => selectAdvisor(advisor)}
                  style={{
                    padding: "16px 18px",
                    background: "#141414",
                    borderRadius: 10,
                    border: "1px solid #222",
                    borderLeft: `4px solid ${advisor.color}`,
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    transition: "border-color 0.2s, background 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = advisor.color;
                    e.currentTarget.style.background = "#1a1a1a";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "#222";
                    e.currentTarget.style.borderLeftColor = advisor.color;
                    e.currentTarget.style.background = "#141414";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: advisor.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontWeight: 600, color: advisor.color, fontSize: 14 }}>
                      {advisor.name}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: "#666" }}>{advisor.domain}</span>
                  <span style={{ fontSize: 12, color: docCount > 0 ? "#A78BFA" : "#555" }}>
                    {docCount > 0 ? `${docCount} document${docCount > 1 ? "s" : ""}` : "No documents"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
