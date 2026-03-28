# ConveneAgent — Your Personal AI Board of Directors

A web app that gives you an always-available virtual board of directors — iconic thinkers and leaders modeled as AI personas. Submit a question, select which board members to consult, and get multi-perspective advisory responses with multi-round deliberation and AI-synthesized consensus reports.

## Board Members
Steve Jobs, Mark Cuban, Indra Nooyi, Nelson Mandela, Elon Musk, Sun Tzu, Meg Whitman, Oprah Winfrey, Warren Buffett, Buddha, Andy Grove

## Features
- **11 Iconic Advisors** — each with unique Voice DNA, real thinking frameworks, and calibrated personas
- **Board Deliberation** — multi-round debates where advisors challenge each other's positions
- **Consensus Reports** — AI moderator synthesizes agreements, tensions, and recommended actions
- **User Profiles** — multiple life domains (Professional, Financial, Personal, Technical, etc.) for contextual advice
- **Custom Advisors** — build your own with custom voice, domain, and thinking frameworks
- **Session History** — revisit past board sessions
- **Mobile Responsive** — full board experience on any device
- **Private & Secure** — per-user data isolation, JWT authentication

## Stack
- **Backend:** FastAPI (Python) + OpenAI API (parallel async calls)
- **Frontend:** React + Vite + TypeScript
- **Database:** PostgreSQL + Alembic migrations
- **Deploy:** Docker Compose + Traefik

## Quick Start

### Dev Mode
```bash
# Backend
cd backend && pip install -r requirements.txt
OPENAI_API_KEY=your-key uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

### Docker
```bash
OPENAI_API_KEY=your-key docker-compose up
```

Frontend: https://conveneagent.machomelab.com
Backend API: https://conveneagent-api.machomelab.com

## Usage
1. Select 3-5 board members from the sidebar
2. Optionally attach user profiles for context (Professional, Financial, etc.)
3. Type your strategic question
4. Click "Convene the Board"
5. Review each advisor's response, then let them debate
6. Generate a consensus report with actionable recommendations

## Adding Custom Advisors
`POST /advisors` with `{ name, role, lens, system_prompt, color }`

## API
- `POST /session` — create a board session (supports `profile_ids` for context)
- `GET /sessions` — list past sessions
- `GET /session/{id}` — get full session
- `POST /session/{id}/deliberate` — run a debate round
- `POST /session/{id}/consensus` — generate consensus report
- `GET /profiles` — list user profiles
- `POST /profiles` — create a profile
- `PUT /profiles/{id}` — update a profile
- `DELETE /profiles/{id}` — delete a profile
- `GET /profiles/templates` — get starter templates
