# MVP Board — Personal AI Board of Directors

## Overview
A web app that gives you an always-available virtual board of directors — iconic thinkers and leaders modeled as AI personas. Submit a question, select which board members to consult, and get multi-perspective advisory responses in a structured "board session" format.

## Stack
- **Frontend:** React + Vite + TypeScript
- **Backend:** FastAPI (Python)
- **AI:** OpenAI API (gpt-4o) — parallel calls per persona
- **Storage:** JSON file-based sessions (no DB needed for v1)
- **Container:** docker-compose.yml for deployment

## Board Members (Default Roster)

| ID | Name | Domain | Challenge Lens |
|----|------|--------|----------------|
| jobs | Steve Jobs | Innovation & Design | "Is this elegant? Would you be proud of it?" |
| cuban | Mark Cuban | Commercial Traction | "Who owns the IP? What's the actual revenue model?" |
| nooyi | Indra Nooyi | Strategy & People | "How do the humans inside this organization experience it?" |
| mandela | Nelson Mandela | Ethics & Values | "Does this align with your core values? What does courage require here?" |
| musk | Elon Musk | Disruption & Scale | "How do you 10x this? What assumption is everyone too afraid to question?" |
| suntzu | Sun Tzu | Power & Positioning | "Who has positional advantage? What does timing dictate?" |
| whitman | Meg Whitman | Operations & Scale | "What does integration actually cost? How do you build for scale?" |
| oprah | Oprah Winfrey | Narrative & Emotional Truth | "What's the real story underneath this? What does your gut say?" |
| buffett | Warren Buffett | Long-term Value | "Would you still like this decision in 10 years? What's the margin of safety?" |
| buddha | Buddha | Clarity & Detachment | "What fear or ego is driving this? What are you attached to?" |

## Features

### Core (MVP)
1. **Board Session UI** — Select 3–5 board members, type your question, submit
2. **Parallel AI calls** — Each selected persona gets their own system prompt + the user's question; all fire simultaneously
3. **Session transcript** — Formatted response showing each advisor's take, with their name/domain/lens header
4. **Session history** — List of past sessions with question preview; click to re-read
5. **Custom personas** — Add your own (name, role, challenge lens, system prompt override)

### System Prompts per Persona
Each persona has a carefully crafted system prompt:
```
You are [NAME], the [ROLE]. You are advising a senior executive who has come to you with a strategic question. 
Respond in [NAME]'s authentic voice and style. 
Your core lens is: [LENS]
Your signature questions you always probe: [SIGNATURE_QUESTIONS]
Be direct, specific, and challenging. 2-4 paragraphs max. No fluff.
```

### UI Layout
- **Left sidebar:** Board roster (card per member, toggle to select/deselect)
- **Main area:** Question input box + "Convene the Board" button
- **Response area:** Tabbed or stacked cards per advisor, color-coded by domain
- **History panel:** Past sessions accessible via side nav or hamburger

## API

### POST /session
```json
{
  "question": "Should we acquire this fintech company or build internally?",
  "advisors": ["jobs", "cuban", "nooyi", "suntzu"]
}
```
Returns a session object with responses from each advisor.

### GET /sessions
Returns list of past sessions (id, question preview, timestamp, advisors used).

### GET /session/{id}
Returns full session with all responses.

### GET /advisors
Returns full board roster.

### POST /advisors
Add a custom advisor.

## Environment
- `OPENAI_API_KEY` — required

## File Structure
```
mvp-board/
├── backend/
│   ├── main.py          # FastAPI app
│   ├── advisors.py      # Persona definitions + system prompts
│   ├── session.py       # Session logic, parallel AI calls
│   ├── storage.py       # File-based JSON storage
│   ├── requirements.txt
│   └── data/            # sessions/*.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── BoardRoster.tsx    # Left sidebar with advisor cards
│   │   │   ├── QuestionForm.tsx   # Question input + submit
│   │   │   ├── SessionView.tsx    # Display a board session's responses
│   │   │   ├── SessionHistory.tsx # Past sessions list
│   │   │   └── AdvisorCard.tsx    # Individual advisor card (select toggle)
│   │   ├── api.ts        # API client
│   │   └── types.ts      # TypeScript types
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Design Notes
- Dark mode by default — feels premium, like a real boardroom
- Each advisor has a color accent (domain-based)
- Responses load with a subtle streaming effect (or staggered reveal) so it feels alive
- Loading state: "The board is deliberating..." with advisor name placeholders
- No auth for v1 — single user local app

## Future Option: Pharma/Oncology Version
A specialized fork for biopharma executive decision support:
- Domain-specific board: Frances Arnold (innovation), Andy Grove (OKRs), Werner Vogels (tech architecture), a "RegBot" persona trained on FDA guidance and ICH guidelines, a "PharmaOps" persona modeled on oncology development patterns
- Pre-loaded context: pipeline data, competitive landscape, key therapy area decisions
- Use case: prep before FDA briefings, pipeline prioritization, BD/licensing decisions
- Integration point: could pull from internal RAG (e.g., your Databot platform) to ground personas in company-specific context

## Build Instructions
1. `cd backend && pip install -r requirements.txt && uvicorn main:app --reload`
2. `cd frontend && npm install && npm run dev`
3. Or: `docker-compose up`

Set `OPENAI_API_KEY` before running.
