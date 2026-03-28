# MVP Board — Roadmap

## ✅ v0.1 — MVP (Shipped 2026-03-28)
- [x] 10 default advisors with system prompts
- [x] Select advisors, submit question, get parallel responses
- [x] Session history (file-based JSON storage)
- [x] Custom persona creation via API
- [x] Dark mode boardroom UI
- [x] Docker Compose deploy to MachomeLab

---

## ✅ v0.2 — Persona Overhaul + Auth (Shipped 2026-03-28)
**Goal:** Make advisors sound like the real people, not generic chatbots.

### Persona Authenticity
- [x] **Voice DNA per advisor** — unique speech patterns, vocabulary, sentence structure, verbal signatures
- [x] **Real thinking frameworks** — encode each advisor's actual methodology
- [x] **Few-shot examples** — 5-10 real quotes per advisor for tone calibration
- [x] **Anti-patterns** — what each advisor would never say
- [x] **Per-advisor temperature** — Buddha/Sun Tzu 0.6, Cuban/Musk 0.9, others 0.7-0.8
- [x] **Andy Grove added** — OKRs, strategic inflection points, "only the paranoid survive"

### Database + Auth
- [x] **PostgreSQL** — replace JSON file storage
- [x] **User accounts** — JWT auth, registration, login, per-user data isolation
- [x] **Alembic migrations** — versioned schema management
- [x] **Mobile responsive** — bottom drawer navigation, full-width layout on phones

---

## 🔧 v0.3 — Board Deliberation (Next)
**Goal:** Advisors discuss and debate each other's positions.

- [ ] **"Let Them Debate" button** — after individual responses, fire a second round where each advisor sees and responds to the others
- [ ] **2-3 rounds of back-and-forth** — Jobs argues with Buffett about elegance vs. margin of safety
- [ ] **Consensus Report** — auto-generated summary: points of agreement, key tensions, recommended actions, which advisor to weight most given the question type
- [ ] **Moderator role** — optional AI moderator that synthesizes, probes, and calls out contradictions

---

## 📋 v0.4 — Context & Memory
**Goal:** Ground advisor responses in real data, not just vibes.

- [ ] **Document upload** — paste or upload background docs (financials, deal memos, competitive analysis) that all advisors reference
- [ ] **Advisor memory** — persist context across sessions so advisors remember prior questions
- [ ] **Session threading** — link follow-up sessions to originals for continuous advisory conversations

---

## 🎯 v0.5 — Boards & Presets
**Goal:** Different boards for different question types.

- [ ] **Custom board presets** — save compositions: "M&A Board" (Cuban, Buffett, Whitman, Grove), "Product Board" (Jobs, Musk, Nooyi)
- [ ] **One-click board load** — select a preset instead of picking advisors manually
- [ ] **Question type routing** — suggest which board preset fits the question

---

## ⚡ v0.6 — UX Polish
- [ ] **Streaming responses** — stream each advisor's response as it arrives (SSE)
- [ ] **Vote/Weight system** — flag which advisor's take resonated most; app learns preferences over time
- [ ] **Export** — PDF/email a board session as a formatted advisory memo
- [ ] **Keyboard shortcuts** — Cmd+Enter to submit, number keys to toggle advisors

---

## 🔬 v0.7 — Deep Persona Research & RAG
**Goal:** Make advisors truly authentic by grounding them in real source material.

### Per-Advisor RAG
- [ ] **Per-advisor vector store** — each advisor gets their own index (pgvector) containing their writings, speeches, interviews, known positions
- [ ] **Contextual retrieval** — on each question, retrieve top 5-10 relevant chunks from advisor's corpus and inject as grounding
- [ ] **Citation support** — responses include `[Source: Berkshire 2023 Annual Letter]` when grounded in real material
- [ ] **Living corpus** — add new interviews/writings as published; living advisors stay current

### Research Sources
- [ ] **Published works** — books, letters, memos, annual reports (Buffett's shareholder letters, Grove's "High Output Management", etc.)
- [ ] **Interview transcripts** — YouTube/podcast transcriptions via Whisper
- [ ] **Speeches & keynotes** — Jobs keynotes, Buffett shareholder meetings, TED talks
- [ ] **Social media / blogs** — Cuban's blogmaverick.com, Musk's X history, Oprah's columns
- [ ] **Biographies** — Isaacson's "Steve Jobs" and "Elon Musk", etc.
- [ ] **Academic analysis** — linguistic studies on communication styles and rhetorical patterns

### Voice Profile Generation
- [ ] **Corpus analysis pipeline** — extract speech patterns, vocabulary frequency, metaphor categories, rhetorical devices, sentence length distribution
- [ ] **Voice profile document** — distilled style guide per advisor generated from corpus analysis
- [ ] **Continuous refinement** — voice profiles improve as corpus grows

---

## 🤖 v0.8 — Advisor Tools (Function Calling)
**Goal:** Give advisors real-time tools to enhance their advice.

- [ ] **Web search** — advisors look up current market data, news, competitive landscape before responding
- [ ] **Financial data** — stock prices, company financials, market caps (Buffett/Cuban use real numbers)
- [ ] **SEC filings** — 10-K/10-Q data for M&A and investment questions
- [ ] **News retrieval** — recent articles relevant to the question topic
- [ ] **Calculator/analysis** — Cuban runs unit economics, Buffett computes margin of safety
- [ ] **User document reference** — advisors cite specific numbers from uploaded deal memos/financial models
- [ ] **Per-advisor tool assignment** — Buffett gets financial tools, Cuban gets market tools, Grove gets OKR/metrics tools

---

## 🧬 v0.9 — Auto-Research Persona Builder
**Goal:** Users type a name, system automatically researches and builds a full advisor persona.

### Pipeline
- [ ] **Step 1: Research** — web search for key works, interviews, philosophy, Wikipedia/biographical data, published books, notable speeches, key quotes
- [ ] **Step 2: Corpus building** — scrape/fetch available public texts, chunk and embed into per-advisor vector store
- [ ] **Step 3: Voice profile generation** — LLM analyzes corpus to generate voice DNA, thinking frameworks, signature questions, anti-patterns, calibration quotes, recommended temperature
- [ ] **Step 4: System prompt generation** — auto-generate full prompt following our template
- [ ] **Step 5: Review & refine** — user reviews generated profile, tweaks voice/frameworks, "test drive" button for sample Q&A

### Features
- [ ] **30-60 second build time** — async background processing with progress indicator
- [ ] **Quality scoring** — rate confidence in the generated persona based on available source material
- [ ] **Iterative refinement** — users can edit, add sources, retrain
- [ ] **Sharing** — publish custom personas to advisor marketplace (opt-in)

---

## 🏥 v1.0 — Pharma / Oncology Edition
**Goal:** Specialized board for biopharma executive decision support.

- [ ] **Domain-specific roster** — Frances Arnold (biotech innovation), Andy Grove (OKRs for R&D), Werner Vogels (tech architecture), RegBot (FDA guidance + ICH guidelines), PharmaOps (oncology development patterns)
- [ ] **Pre-loaded context** — pipeline data, competitive landscape, key therapy area decisions
- [ ] **RAG integration** — pull from Databot platform to ground personas in company-specific context
- [ ] **Use cases** — prep for FDA briefings, pipeline prioritization, BD/licensing decisions, competitive response planning

---

## 💡 Future Ideas (Unprioritized)
- **Voice mode** — speak your question, hear advisors respond in character voices (ElevenLabs TTS)
- **Advisor marketplace** — community-created personas (share/import)
- **Team boards** — multiple users in a shared board session, each seeing the same deliberation
- **Slack/Teams integration** — convene the board from a chat message
- **API access** — programmatic board sessions for integration into other workflows
- **Scenario simulation** — "What would happen if..." multi-turn scenario planning with the full board
- **Historical accuracy mode** — flag when a response is grounded in real source material vs. model inference
- **Advisor chemistry** — track which advisor pairings produce the most insightful debates
- **Decision journal** — log which advisor's advice you followed, track outcomes over time

---

## 📦 Pre-Built Persona Library
Potential advisors to offer as one-click additions:

### Business & Strategy
Peter Thiel, Jeff Bezos, Reed Hastings, Ray Dalio, Jack Welch, Sheryl Sandberg, Sam Walton, Richard Branson

### Technology & Innovation
Alan Turing, Ada Lovelace, Grace Hopper, Linus Torvalds, Jensen Huang

### Investing & Finance
Charlie Munger, Benjamin Graham, George Soros, Cathie Wood

### Military & Strategy
Carl von Clausewitz, Napoleon Bonaparte, Alexander the Great, Dwight Eisenhower

### Philosophy & Wisdom
Marcus Aurelius, Socrates, Confucius, Nassim Taleb, Naval Ravikant

### Science & Systems Thinking
Richard Feynman, Marie Curie, Charles Darwin, Buckminster Fuller

### Politics & Leadership
Abraham Lincoln, Winston Churchill, Margaret Thatcher, Martin Luther King Jr., Cleopatra

### Creative & Cultural
Walt Disney, Leonardo da Vinci, Coco Chanel, David Bowie

### Sports & Performance
Phil Jackson, Bill Belichick, Vince Lombardi

### Pharma / Healthcare
Frances Arnold, Paul Janssen, Katalin Karikó
