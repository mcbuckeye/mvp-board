import type { Advisor, Session, SessionSummary } from "./types";

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
  advisors: string[]
): Promise<Session> {
  const res = await fetch(`${BASE}/session`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ question, advisors }),
  });
  return res.json();
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
