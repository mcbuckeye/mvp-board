import type { Advisor, Session, SessionSummary } from "./types";

const BASE = "";

export async function fetchAdvisors(): Promise<Advisor[]> {
  const res = await fetch(`${BASE}/advisors`);
  return res.json();
}

export async function createSession(
  question: string,
  advisors: string[]
): Promise<Session> {
  const res = await fetch(`${BASE}/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, advisors }),
  });
  return res.json();
}

export async function fetchSessions(): Promise<SessionSummary[]> {
  const res = await fetch(`${BASE}/sessions`);
  return res.json();
}

export async function fetchSession(id: string): Promise<Session> {
  const res = await fetch(`${BASE}/session/${id}`);
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(advisor),
  });
  return res.json();
}
