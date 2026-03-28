# MVP Board — Roadmap

## v0.1 — MVP (Shipped 2026-03-28)
- [x] 10 default advisors with system prompts
- [x] Select advisors, submit question, get parallel responses
- [x] Session history (file-based JSON storage)
- [x] Custom persona creation via API
- [x] Dark mode boardroom UI
- [x] Docker Compose deploy to MachomeLab

---

## v0.2 — Persona Overhaul + Auth (Shipped 2026-03-28)
**Goal:** Make advisors sound like the real people, not generic chatbots.

### Persona Authenticity
- [x] **Voice DNA per advisor** — unique speech patterns, vocabulary, sentence structure, verbal signatures
- [x] **Real thinking frameworks** — encode each advisor's actual methodology (Buffett: moats/margin of safety/circle of competence; Grove: OKRs/strategic inflection points/paranoid thinking; Jobs: simplicity/intersection of tech and liberal arts)
- [x] **Few-shot examples** — seed prompts with 5-10 real quotes so the model calibrates tone
- [x] **Anti-patterns** — tell the model what each person would *never* say to prevent voice bleed-through
- [x] **Per-advisor temperature** — Buddha/Sun Tzu lower (precise, aphoristic), Cuban/Musk higher (spontaneous, provocative)
- [x] **Add Andy Grove** — OKRs, High Output Management, strategic inflection points, "only the paranoid survive"

### Database + Auth
- [x] **PostgreSQL** — replace JSON file storage with proper DB (sessions, advisors, users tables)
- [x] **User accounts** — JWT auth, registration, login
- [x] **Per-user data isolation** — each user has their own sessions, custom advisors, board presets
- [x] **Alembic migrations** — versioned schema management

---

## v0.3 — Board Deliberation
**Goal:** Advisors discuss and debate each other's positions.

- [ ] **"Let Them Debate" button** — after individual responses, fire a second round where each advisor sees and responds to the others
- [ ] **2-3 rounds of back-and-forth** — Jobs argues with Buffett about elegance vs. margin of safety
- [ ] **Consensus Report** — auto-generated summary: points of agreement, key tensions, recommended actions, which advisor to weight most given the question type
- [ ] **Moderator role** — optional AI moderator that synthesizes, probes, and calls out contradictions

---

## v0.4 — Context & Memory
**Goal:** Ground advisor responses in real data, not just vibes.

- [ ] **Document upload** — paste or upload background docs (financials, deal memos, competitive analysis) that all advisors reference
- [ ] **Advisor memory** — persist context across sessions so advisors remember prior questions ("Last month you asked about the acquisition — how did that play out?")
- [ ] **Session threading** — link follow-up sessions to originals for continuous advisory conversations

---

## v0.5 — Boards & Presets
**Goal:** Different boards for different question types.

- [ ] **Custom board presets** — save compositions: "M&A Board" (Cuban, Buffett, Whitman, Grove), "Product Board" (Jobs, Musk, Nooyi)
- [ ] **One-click board load** — select a preset instead of picking advisors manually
- [ ] **Question type routing** — suggest which board preset fits the question

---

## v0.6 — UX Polish
- [ ] **Streaming responses** — stream each advisor's response as it arrives instead of waiting for all
- [ ] **Vote/Weight system** — flag which advisor's take resonated most; over time the app learns your preferences per question type
- [ ] **Export** — PDF/email a board session as a formatted advisory memo
- [ ] **Mobile responsive** — proper mobile layout for on-the-go advisory sessions
- [ ] **Keyboard shortcuts** — Cmd+Enter to submit, number keys to toggle advisors

---

## v1.0 — Pharma / Oncology Edition
**Goal:** Specialized board for biopharma executive decision support.

- [ ] **Domain-specific roster** — Frances Arnold (biotech innovation), Andy Grove (OKRs for R&D), Werner Vogels (tech architecture), RegBot (FDA guidance + ICH guidelines), PharmaOps (oncology development patterns)
- [ ] **Pre-loaded context** — pipeline data, competitive landscape, key therapy area decisions
- [ ] **RAG integration** — pull from Databot platform to ground personas in company-specific context
- [ ] **Use cases** — prep for FDA briefings, pipeline prioritization, BD/licensing decisions, competitive response planning

---

## Future Ideas (Unprioritized)
- **Voice mode** — speak your question, hear advisors respond in character voices (ElevenLabs TTS)
- **Advisor marketplace** — community-created personas (share/import)
- **Team boards** — multiple users in a shared board session, each seeing the same deliberation
- **Slack/Teams integration** — convene the board from a chat message
- **API access** — programmatic board sessions for integration into other workflows
- **Historical accuracy mode** — ground responses in the advisor's actual published works, speeches, and interviews via RAG
- **Scenario simulation** — "What would happen if..." multi-turn scenario planning with the full board
