import { useState } from "react";

interface Props {
  selectedCount: number;
  loading: boolean;
  onSubmit: (question: string) => void;
}

export default function QuestionForm({ selectedCount, loading, onSubmit }: Props) {
  const [question, setQuestion] = useState("");

  const canSubmit = question.trim().length > 0 && selectedCount >= 1 && !loading;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="What strategic question would you like the board to weigh in on?"
        rows={4}
        style={{
          width: "100%",
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
      <button
        disabled={!canSubmit}
        onClick={() => {
          onSubmit(question.trim());
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
        {loading ? "The board is deliberating..." : `Convene the Board (${selectedCount} selected)`}
      </button>
    </div>
  );
}
