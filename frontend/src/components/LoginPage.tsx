import { useState } from "react";
import { useAuth } from "../AuthContext";

export default function LoginPage({ defaultRegister = false, onBack }: { defaultRegister?: boolean; onBack?: () => void }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(defaultRegister);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, displayName);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0d0d0d",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: 380,
          padding: 32,
          background: "#111",
          borderRadius: 12,
          border: "1px solid #222",
        }}
      >
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              color: "#666",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "Inter, sans-serif",
              padding: "0 0 16px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ← Back
          </button>
        )}
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: 24,
            fontWeight: 700,
            color: "#A78BFA",
            textAlign: "center",
          }}
        >
          ConveneAgent
        </h1>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: 13,
            color: "#666",
            textAlign: "center",
          }}
        >
          Your AI Board of Directors
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {isRegister && (
            <input
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              style={inputStyle}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={inputStyle}
          />

          {error && (
            <div style={{ color: "#EF4444", fontSize: 13, padding: "4px 0" }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              border: "none",
              background: loading ? "#333" : "#7C3AED",
              color: loading ? "#666" : "#fff",
              fontWeight: 600,
              fontSize: 15,
              cursor: loading ? "default" : "pointer",
              fontFamily: "Inter, sans-serif",
              marginTop: 4,
            }}
          >
            {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#A78BFA",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {isRegister ? "Already have an account? Sign in" : "Need an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "#1a1a1a",
  color: "#eee",
  fontSize: 14,
  fontFamily: "Inter, sans-serif",
  outline: "none",
};
