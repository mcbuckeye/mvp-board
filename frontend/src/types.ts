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
  round: number;
}

export interface Session {
  id: string;
  question: string;
  advisors: string[];
  timestamp: string;
  responses: AdvisorResponse[];
  max_round: number;
  has_consensus: boolean;
  starred_advisor_id?: string | null;
}

export interface SessionSummary {
  id: string;
  question: string;
  advisors: string[];
  timestamp: string;
}

export interface UserProfile {
  id: string;
  profile_type: string;
  title: string;
  content: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProfileTemplate {
  profile_type: string;
  title: string;
  content: string;
}

export interface BoardPreset {
  id: string;
  name: string;
  description: string | null;
  advisor_ids: string[];
  color: string;
  is_system: boolean;
  created_at?: string | null;
}
