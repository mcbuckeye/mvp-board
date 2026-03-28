import type { Advisor, Session, SessionSummary, UserProfile, ProfileTemplate, BoardPreset, AdvisorResponse } from "./types";

const BASE = "";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function fetchAdvisors(): Promise<Advisor[]> {
  const res = await fetch(`${BASE}/advisors`, { headers: authHeaders() });
  return res.json();
}

export async function createSession(
  question: string,
  advisors: string[],
  profileIds?: string[]
): Promise<Session> {
  const res = await fetch(`${BASE}/session`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ question, advisors, profile_ids: profileIds }),
  });
  return res.json();
}

export async function createSessionStreaming(
  question: string,
  advisors: string[],
  profileIds: string[] | undefined,
  onResponse: (response: AdvisorResponse) => void,
  onComplete: (sessionId: string) => void,
  onError: (error: string) => void
): Promise<void> {
  const res = await fetch(`${BASE}/session/stream`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ question, advisors, profile_ids: profileIds }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Streaming failed" }));
    onError(err.detail || "Streaming failed");
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    onError("Streaming not supported");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.type === "response") {
          const { type, ...response } = data;
          onResponse(response as AdvisorResponse);
        } else if (data.type === "complete") {
          onComplete(data.session_id);
        }
      } catch {
        // skip malformed lines
      }
    }
  }
}

export async function fetchSessions(): Promise<SessionSummary[]> {
  const res = await fetch(`${BASE}/sessions`, { headers: authHeaders() });
  return res.json();
}

export async function fetchSession(id: string): Promise<Session> {
  const res = await fetch(`${BASE}/session/${id}`, { headers: authHeaders() });
  return res.json();
}

export async function addAdvisor(advisor: {
  id: string;
  name: string;
  domain: string;
  lens: string;
  color?: string;
  system_prompt?: string;
}): Promise<Advisor> {
  const res = await fetch(`${BASE}/advisors`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(advisor),
  });
  return res.json();
}

export async function deliberate(sessionId: string): Promise<Session> {
  const res = await fetch(`${BASE}/session/${sessionId}/deliberate`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Deliberation failed" }));
    throw new Error(err.detail || "Deliberation failed");
  }
  return res.json();
}

// ---------- profiles ----------

export async function fetchProfiles(): Promise<UserProfile[]> {
  const res = await fetch(`${BASE}/profiles`, { headers: authHeaders() });
  return res.json();
}

export async function fetchProfileTemplates(): Promise<Record<string, ProfileTemplate>> {
  const res = await fetch(`${BASE}/profiles/templates`, { headers: authHeaders() });
  return res.json();
}

export async function createProfile(data: {
  profile_type: string;
  title: string;
  content: string;
}): Promise<UserProfile> {
  const res = await fetch(`${BASE}/profiles`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateProfile(
  id: string,
  data: { profile_type?: string; title?: string; content?: string }
): Promise<UserProfile> {
  const res = await fetch(`${BASE}/profiles/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteProfile(id: string): Promise<void> {
  await fetch(`${BASE}/profiles/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function generateConsensus(sessionId: string): Promise<Session> {
  const res = await fetch(`${BASE}/session/${sessionId}/consensus`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Consensus generation failed" }));
    throw new Error(err.detail || "Consensus generation failed");
  }
  return res.json();
}

// ---------- presets ----------

export async function fetchPresets(): Promise<BoardPreset[]> {
  const res = await fetch(`${BASE}/presets`, { headers: authHeaders() });
  return res.json();
}

export async function createPreset(data: {
  name: string;
  description?: string;
  advisor_ids: string[];
  color?: string;
}): Promise<BoardPreset> {
  const res = await fetch(`${BASE}/presets`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updatePreset(
  id: string,
  data: { name?: string; description?: string; advisor_ids?: string[]; color?: string }
): Promise<BoardPreset> {
  const res = await fetch(`${BASE}/presets/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deletePreset(id: string): Promise<void> {
  await fetch(`${BASE}/presets/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

// ---------- knowledge base ----------

export interface AdvisorDocumentSummary {
  id: string;
  advisor_id: string;
  title: string;
  source_url: string | null;
  source_type: string;
  chunk_count: number;
  created_at: string | null;
}

export async function fetchKnowledgeBaseSummary(): Promise<Record<string, number>> {
  const res = await fetch(`${BASE}/knowledge-base/summary`, { headers: authHeaders() });
  return res.json();
}

export async function fetchAdvisorDocuments(advisorId: string): Promise<AdvisorDocumentSummary[]> {
  const res = await fetch(`${BASE}/advisors/${advisorId}/documents`, { headers: authHeaders() });
  return res.json();
}

export async function uploadAdvisorDocument(
  advisorId: string,
  data: { title: string; content: string; source_url?: string; source_type: string }
): Promise<AdvisorDocumentSummary> {
  const res = await fetch(`${BASE}/advisors/${advisorId}/documents`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function deleteAdvisorDocument(advisorId: string, docId: string): Promise<void> {
  await fetch(`${BASE}/advisors/${advisorId}/documents/${docId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

// ---------- star ----------

export async function starAdvisor(sessionId: string, advisorId: string | null): Promise<void> {
  await fetch(`${BASE}/session/${sessionId}/star`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ advisor_id: advisorId }),
  });
}
