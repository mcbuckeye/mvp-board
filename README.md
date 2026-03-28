# MVP Board — Personal AI Board of Directors

A web app that gives you an always-available virtual board of directors — iconic thinkers and leaders modeled as AI personas. Submit a question, select which board members to consult, and get multi-perspective advisory responses.

## Board Members
Steve Jobs, Mark Cuban, Indra Nooyi, Nelson Mandela, Elon Musk, Sun Tzu, Meg Whitman, Oprah Winfrey, Warren Buffett, Buddha

## Stack
- **Backend:** FastAPI (Python) + OpenAI API (parallel async calls)
- **Frontend:** React + Vite + TypeScript
- **Storage:** JSON file-based sessions

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

Frontend: http://localhost:5173  
Backend API: http://localhost:8000

## Usage
1. Select 3–5 board members from the left sidebar
2. Type your strategic question
3. Click "Convene the Board"
4. Review each advisor's response, color-coded by domain

## Adding Custom Advisors
`POST /advisors` with `{ name, role, lens, system_prompt, color }`

## Future: Pharma/Oncology Version
See PRD.md for notes on a BeOne-specific build with domain experts and RAG integration.
