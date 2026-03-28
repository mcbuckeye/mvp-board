export interface Advisor {
  id: string;
  name: string;
  domain: string;
  lens: string;
  color: string;
  system_prompt: string;
}

export interface AdvisorResponse {
  advisor_id: string;
  name: string;
  domain: string;
  color: string;
  response: string;
}

export interface Session {
  id: string;
  question: string;
  advisors: string[];
  timestamp: string;
  responses: AdvisorResponse[];
}

export interface SessionSummary {
  id: string;
  question: string;
  advisors: string[];
  timestamp: string;
}
