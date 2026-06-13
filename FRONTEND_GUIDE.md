# ExamFar Frontend — Next.js Blueprint
### "Every dashboard, every page, every feature, wired to a real API endpoint"

> A complete, build-ready frontend plan. Each page lists its features and the exact backend
> endpoints it calls. Nothing is hand-wavy — if a page shows data, the API that feeds it is named.

---

## PART 0 — TECH STACK & GROUND RULES

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 14 (App Router)** | Server Components for fast loads, Route Handlers for BFF proxying |
| Language | **TypeScript** | Type-safe API contracts shared with the backend |
| Styling | **Tailwind CSS + shadcn/ui** | Fast, consistent, accessible components |
| Data fetching | **TanStack Query (React Query)** | Caching, retries, optimistic updates, polling |
| Forms | **React Hook Form + Zod** | Same Zod schemas as backend = no validation drift |
| Real-time | **socket.io-client** | Proctoring WebSocket |
| State | **Zustand** | Lightweight session/exam state (timer, current question) |
| Charts | **Recharts** | Scoreboards, score distributions, risk timelines |
| Auth | **JWT in memory + refresh cookie** | Access token in memory, refresh via HttpOnly cookie |
| PDF | **react-pdf / @react-pdf/renderer** | Result report downloads |

### The 4 Apps (route groups)

Next.js App Router lets us split by **route groups**. We have 4 logical apps under one Next.js project:

```
app/
├── (auth)/            → Login, OTP        [public]
├── (admin)/           → Admin + Examiner + Invigilator dashboards   [staff]
├── (exam)/            → Student exam portal   [candidate]
└── (public)/          → Public registration, public scoreboard   [no auth]
```

### Universal rules every page follows
1. **API base:** `NEXT_PUBLIC_API_URL = http://localhost:3000/api/v1`
2. **Auth header:** Axios interceptor injects `Authorization: Bearer <accessToken>`; on 401 → silent `POST /auth/refresh` → retry once → else redirect to login.
3. **Response shape:** Every call unwraps `{ success, data }` → `data`. Errors throw `{ code, message }`.
4. **Loading/empty/error:** Every data page has 3 states — skeleton loader, empty state, error toast.
5. **RBAC in UI:** The decoded JWT role hides/shows nav items and buttons (the backend still enforces — UI is just UX).

---

## PART 1 — DASHBOARD MAP (the big picture)

| # | Dashboard | Who | Pages | Primary job |
|---|-----------|-----|-------|-------------|
| **A** | Authentication | Everyone | **3** | Get a token |
| **B** | Admin Dashboard | Admin | **6** | Run the institution |
| **C** | Examiner Dashboard | Examiner/Admin | **9** | Build & grade exams |
| **D** | Invigilator Dashboard | Invigilator | **2** | Watch live exams |
| **E** | Student Portal | Candidate | **8** | Take exams, see results |
| **F** | Public Pages | Anyone | **2** | Register, public scoreboard |
| | **TOTAL** | | **30 pages** | |

---

## DASHBOARD A — AUTHENTICATION (3 pages)

Route group: `app/(auth)/`

### A1 — `/login` — Staff Login
**Features:**
- Email + password form (admin, examiner, invigilator)
- "Login with OTP instead" link → routes to `/otp`
- Inline error on bad credentials, rate-limit feedback
- Remember-me (extends refresh token lifetime)

**APIs used:**
| Action | Endpoint |
|--------|----------|
| Submit login | `POST /auth/login` |
| Restore session on load | `GET /auth/me` |
| Silent token refresh | `POST /auth/refresh` |

**On success:** decode JWT role → redirect: ADMIN→`/admin`, EXAMINER→`/examiner`, INVIGILATOR→`/monitor`.

---

### A2 — `/otp` — Student OTP Login (2-step)
**Features:**
- Step 1: email input → "Send OTP"
- Step 2: 6-box OTP input, auto-advance, auto-submit on 6th digit, 60s resend cooldown timer
- Auto-creates the student account on first verify

**APIs used:**
| Action | Endpoint |
|--------|----------|
| Request code | `POST /auth/otp/request` |
| Verify code | `POST /auth/otp/verify` |

**On success:** redirect to `/exams` (student exam list).

---

### A3 — `/logout` — (route handler, not a visible page)
Clears tokens, calls nothing backend-side (stateless JWT), redirects to `/login`.

---

## DASHBOARD B — ADMIN DASHBOARD (6 pages)

Route group: `app/(admin)/admin/`
Layout: persistent left sidebar (Overview, Exams, Questions, Users, Proctoring, Audit) + top bar (institution name, profile).

### B1 — `/admin` — Overview / Home
**Features:**
- KPI cards: exams live now, students online, exams scheduled today, pending gradings, open grievances
- "Live exams" strip — each card links to its proctoring monitor
- Recent activity feed (from audit logs)
- Quick actions: Create Exam, Import Roster, View Reports

**APIs used:**
| Widget | Endpoint |
|--------|----------|
| Exam counts & live strip | `GET /exams?status=LIVE` + `GET /exams?status=SCHEDULED` |
| Pending gradings badge | `GET /evaluations/review-queue` (count) |
| Open grievances badge | `GET /grievances?status=OPEN` (count) |

---

### B2 — `/admin/exams` — All Exams (institution-wide)
**Features:**
- Filterable, paginated table: Title, Mode chip, Status badge, Start, Enrolled count, Actions
- Filter bar: status, mode, date range, search
- Row actions: View, Edit (if DRAFT), Monitor (if LIVE), Results (if published)
- "Create Exam" button → `/examiner/exams/create`

**APIs used:**
| Action | Endpoint |
|--------|----------|
| List | `GET /exams?status=&mode=&page=&limit=` |
| Open one | `GET /exams/:id` |

---

### B3 — `/admin/users` — User & Role Management
**Features:**
- Table of all users: name, email, role badge, status
- Invite/create staff (assign EXAMINER / INVIGILATOR)
- Deactivate / reactivate user
- (Note: backend user-admin endpoints to be added; today seeded via `seed.ts`)

**APIs used:** `GET /auth/me` for self; user-management CRUD endpoints (extension point).

---

### B4 — `/admin/proctoring` — Proctoring Command Center
**Features:**
- Grid of ALL currently live exams with aggregate risk heat (how many HIGH-risk sessions per exam)
- Click an exam → opens the live monitor (Dashboard D)

**APIs used:**
| Action | Endpoint |
|--------|----------|
| Live exams | `GET /exams?status=LIVE` |
| Per-exam live feed | `GET /proctor/live?examId=:id` |

---

### B5 — `/admin/audit` — Audit Trail
**Features:**
- Searchable, filterable audit log: actor, action, target, timestamp
- Filter by action type (publish, override, extend-time, grievance-resolve)
- Tamper-evidence note (append-only)

**APIs used:** audit log read endpoint (extension point; data already written by every mutating service).

---

### B6 — `/admin/settings` — Institution Settings
**Features:**
- Institution profile, default proctoring weights, default marking config
- Branding (logo, colors used in student portal)

**APIs used:** institution settings endpoint (extension point).

---

## DASHBOARD C — EXAMINER DASHBOARD (9 pages)

Route group: `app/(admin)/examiner/`
This is the **heaviest** dashboard — exam authoring, question bank, grading, results, grievances.

### C1 — `/examiner` — Examiner Home
**Features:**
- My exams (drafts, scheduled, live, awaiting grading)
- "Needs your attention" queue: low-confidence gradings, open grievances
- Shortcuts: New Exam, New Question, AI Generate

**APIs used:**
| Widget | Endpoint |
|--------|----------|
| My exams | `GET /exams?page=1` |
| Grading queue count | `GET /evaluations/review-queue?examId=` |
| Grievances count | `GET /grievances?status=OPEN` |

---

### C2 — `/examiner/exams/create` — Create Exam Wizard (multi-step)
**Features — 5 steps:**
1. **Basics:** title, description, mode selector (ADAPTIVE / FIXED / RANDOMISED with explainer cards), registration type
2. **Timing:** duration, start/end window, optional scheduled-publish datetime
3. **Marking:** marks default, negative marking toggle + penalty ratio, section weights
4. **Adaptive/Blueprint:** (if ADAPTIVE) seTarget, minItems, maxItems; (if RANDOMISED) blueprint by topic/difficulty count
5. **Proctoring:** require camera toggle, signal weights (tab switch, gaze, face missing), review & save

**APIs used:**
| Action | Endpoint |
|--------|----------|
| Save draft | `POST /exams` |

**On save:** redirect to `/examiner/exams/:id` (detail).

---

### C3 — `/examiner/exams/:id` — Exam Detail (tabbed)
**Tabs:** Overview · Questions · Students · Sessions · Results
**Features:**
- **Overview:** all config, status badge, edit (if DRAFT), Publish button, Close button, danger zone
- Publish flow: confirmation modal → scheduled vs immediate

**APIs used:**
| Action | Endpoint |
|--------|----------|
| Load exam | `GET /exams/:id` |
| Edit (DRAFT only) | `PATCH /exams/:id` |
| Publish | `POST /exams/:id/publish` |
| Close early | `POST /exams/:id/close` |

---

### C4 — `/examiner/exams/:id/questions` — Exam's Question Set
**Features:**
- Add questions to this exam from the bank (search & multi-select)
- Reorder (drag-and-drop) for FIXED mode
- Set per-question weight/marks override
- Remove from exam

**APIs used:**
| Action | Endpoint |
|--------|----------|
| Browse bank | `GET /questions?difficulty=&topic=&page=` |
| (attach/reorder handled via exam update) | `PATCH /exams/:id` |

---

### C5 — `/examiner/questions` — Question Bank
**Features:**
- Searchable, filterable grid: stem preview, type, difficulty, marks, usage count, calibration status
- Filters: difficulty, topic, type, calibration (CALIBRATED / FIELD_TEST / UNCALIBRATED)
- Actions: Add Question, Bulk Import, AI Generate, Edit, View versions

**APIs used:**
| Action | Endpoint |
|--------|----------|
| List | `GET /questions?difficulty=&topic=&calibration=&page=&limit=` |

---

### C6 — `/examiner/questions/new` — Create / Edit Question
**Features:**
- Type selector → dynamic form:
  - **MCQ/Multi-select:** option editor, mark correct option(s)
  - **Short/Long:** rubric builder (criteria + max marks per criterion) — **required for subjective**
  - **Numeric:** answer + tolerance
  - **Code:** test cases
- Difficulty, topic tags, marks
- Version warning when editing an in-use question

**APIs used:**
| Action | Endpoint |
|--------|----------|
| Create | `POST /questions` |
| Edit (versions if in use) | `PATCH /questions/:id` |

---

### C7 — `/examiner/questions/import` — Bulk Import (2-phase)
**Features:**
- Drag-drop CSV upload
- Phase 1 preview: green/red row table, error report, "Import N valid" button
- Phase 2 commit: confirm → saved; expired-preview handling (10 min TTL)

**APIs used:**
| Action | Endpoint |
|--------|----------|
| Preview | `POST /questions/bulk/preview` (multipart) |
| Commit | `POST /questions/bulk/commit` |

---

### C8 — `/examiner/questions/ai-generate` — AI Question Studio
**Features:**
- Prompt panel: topic, count slider, difficulty, type, language
- Generated drafts as editable cards with "AI generated" badge
- Per-card: edit inline → Save to bank, or Discard
- Never auto-saves (human-in-the-loop enforced)

**APIs used:**
| Action | Endpoint |
|--------|----------|
| Generate | `POST /questions/ai-draft` |
| Save an approved draft | `POST /questions` |

---

### C9 — `/examiner/exams/:id/grading` — Evaluation Queue
**Features:**
- Subjective answers needing review, **sorted lowest AI-confidence first**
- Split view: student answer (left) · rubric + AI per-criterion scores + justification (right)
- Confidence bar per item
- Actions: Approve AI grade, or Override (editable criterion scores, live total)

**APIs used:**
| Action | Endpoint |
|--------|----------|
| Load queue | `GET /evaluations/review-queue?examId=:id` |
| Approve | `POST /evaluations/:id/approve` |
| Override | `POST /evaluations/:id/override` |

---

### C10 (bonus) — `/examiner/exams/:id/results` — Results & Scoreboard Admin
**Features:**
- "Publish Results" button (enabled when grading complete)
- Scoreboard preview table: rank, name, score, percentile
- Score distribution histogram (Recharts)
- Per-student drill-down to report

**APIs used:**
| Action | Endpoint |
|--------|----------|
| Publish | `POST /exams/:id/results/publish` |
| Scoreboard | `GET /exams/:id/scoreboard` |
| Student report | `GET /sessions/:id/report` |

---

### C11 (bonus) — `/examiner/grievances` — Dispute Management
**Features:**
- Disputes table filtered by status (OPEN / UPHELD / REJECTED)
- Detail panel: student answer, question, dispute reason
- Resolve: Uphold (optional marks adjust + note) or Reject — upholding auto re-ranks scoreboard

**APIs used:**
| Action | Endpoint |
|--------|----------|
| List | `GET /grievances?status=OPEN` |
| Resolve | `POST /grievances/:id/resolve` |

> C1–C9 are the core 9; C10/C11 fold into the exam-detail and home flows but are documented as their own routes for clarity.

---

## DASHBOARD D — INVIGILATOR DASHBOARD (2 pages)

Route group: `app/(admin)/monitor/`
Real-time, WebSocket-driven. The most "live" surface in the app.

### D1 — `/monitor` — My Live Exams
**Features:**
- List of exams currently LIVE that this invigilator is assigned to
- Each card: exam title, # active candidates, # HIGH-risk, enter button

**APIs used:**
| Action | Endpoint |
|--------|----------|
| Live exams | `GET /exams?status=LIVE` |

---

### D2 — `/monitor/:examId` — Live Proctoring Wall
**Features:**
- Grid of candidate cards: name, risk badge (green/yellow/red), last event, mini event timeline
- **Sorted by risk descending** (highest risk floats to top, auto-reorders in real time)
- Click a card → detail drawer: full event timeline, webcam snapshot frames, risk breakdown
- Per-candidate actions: Flag (with note), Extend Time, Send Message
- Connection-health indicator (WS connected / fallback to REST polling)

**APIs used:**
| Action | Endpoint |
|--------|----------|
| Initial load | `GET /proctor/live?examId=:id` |
| Real-time updates | `WS /ws/proctor` → listen `proctor:update` |
| Send candidate message | `WS /ws/proctor` → emit `invig:message` |
| REST fallback for events | `POST /sessions/:id/events` |
| Flag | `POST /sessions/:id/flag` |
| Extend time | `POST /sessions/:id/extend-time` |

**Real-time pattern:** load initial state via REST, then subscribe via WebSocket. Each `proctor:update` patches the matching candidate card and re-sorts. If WS drops → fall back to polling `GET /proctor/live` every 5s and show a "reconnecting" banner.

---

## DASHBOARD E — STUDENT PORTAL (8 pages)

Route group: `app/(exam)/`
Two visual modes: **normal portal** (browse/register/results) and **locked exam mode** (fullscreen, proctored, minimal chrome).

### E1 — `/exams` — My Exams
**Features:**
- Three sections: Upcoming, Available to register, Completed
- Each card: title, date/time, mode, status, action button (Register / Enter / View Result)

**APIs used:**
| Action | Endpoint |
|--------|----------|
| Available/enrolled exams | `GET /exams?status=LIVE` + `GET /exams?status=SCHEDULED` |
| Restore identity | `GET /auth/me` |

---

### E2 — `/exams/:id/register` — Self Registration
**Features:**
- Exam info, "X seats remaining" live counter
- Form: name, email (prefilled), phone
- Waitlist messaging when full

**APIs used:**
| Action | Endpoint |
|--------|----------|
| Register | `POST /exams/:examId/register` |

**Result:** ENROLLED → confirmation w/ slot; WAITLISTED → "we'll email you."

---

### E3 — `/exams/:id/check` — System Check (precheck gate)
**Features:**
- Live checklist: camera (with preview thumbnail), mic, network speed, browser compatibility, fullscreen
- Each item shows pass/fail; "Start Exam" disabled until all pass
- Requests camera/mic permissions, runs a quick network test

**APIs used:**
| Action | Endpoint |
|--------|----------|
| Submit readiness | `POST /sessions/:examId/precheck` |

**Result:** if `examLive` and all gates pass → unlock "Start Exam".

---

### E4 — `/exam/:examId` — The Exam Runner (the core experience)
This is **locked exam mode** — fullscreen, no nav, tab-switch detection active.

**Features:**
- **Top bar:** server-synced countdown timer, question progress (Q 5 of 40 / or "Adaptive"), connection dot
- **Question panel:** stem, options/answer input by type, marks indicator
- **Navigation:** Next / Submit Answer; (Previous only for FIXED/RANDOMISED — hidden in ADAPTIVE)
- **Auto-save** each answer to localStorage before POST; "Saving… / Saved ✓ / Retrying…" status
- **Proctoring (invisible):** background listeners emit tab-switch, blur, fullscreen-exit, face events over WS
- **Heartbeat:** every 10–15s, syncs remaining time, detects second-device takeover
- **Submit:** confirmation modal with answered count → thank-you screen

**APIs used:**
| Action | Endpoint |
|--------|----------|
| Start session | `POST /sessions/:examId/start` |
| Get next question | `GET /sessions/:id/next-item` |
| Submit answer | `POST /sessions/:id/answer` |
| Keep-alive + timer | `POST /sessions/:id/heartbeat` |
| Submit exam | `POST /sessions/:id/submit` |
| Emit proctoring events | `WS /ws/proctor` → emit `proctor:events` |
| Event fallback | `POST /sessions/:id/events` |

**Critical patterns:**
- Timer driven by `remainingSeconds` from start/heartbeat — never the client clock.
- `clientNonce` generated per question; retries reuse the same nonce (idempotent, no double-score).
- ADAPTIVE: no back button; show upfront "you can't review previous questions."
- `next-item` returning `{ done: true }` → auto-prompt submit.

---

### E5 — `/exam/:examId/resume` — Resume After Disconnect
**Features:**
- Detected on portal load if an active session exists
- Shows remaining time + answered count, single "Resume Exam" button
- Re-acquires the session lock on this device

**APIs used:**
| Action | Endpoint |
|--------|----------|
| Resume | `POST /sessions/:examId/resume` |

**Result:** drops back into `/exam/:examId` with exact remaining time and progress.

---

### E6 — `/exam/submitted` — Post-Submit Confirmation
**Features:**
- "Submitted successfully" with timestamp
- "Results will be available once graded" status
- Link back to `/exams`

**APIs used:** none (terminal screen); optionally polls `GET /sessions/:id/report` for status.

---

### E7 — `/results/:sessionId` — My Result Report
**Features:**
- Score badge, rank, percentile, section-wise breakdown
- Per-question list: stem, my answer, correct/incorrect, marks awarded
- For subjective: rubric breakdown + AI/human justification
- "Raise Dispute" button per question
- Download PDF

**APIs used:**
| Action | Endpoint |
|--------|----------|
| Report | `GET /sessions/:id/report` |
| Scoreboard context | `GET /exams/:id/scoreboard` |

---

### E8 — `/results/:sessionId/dispute` — Raise a Dispute
**Features:**
- Pick the disputed question, write the reason
- Only available while results are FINAL
- Status tracking after submission

**APIs used:**
| Action | Endpoint |
|--------|----------|
| Raise | `POST /results/:id/grievance` |

---

## DASHBOARD F — PUBLIC PAGES (2 pages)

Route group: `app/(public)/`

### F1 — `/r/:examId` — Public Registration Landing
**Features:** shareable link, exam summary, seats remaining, OTP-gated registration form.
**APIs used:** `POST /auth/otp/request` → `POST /auth/otp/verify` → `POST /exams/:examId/register`.

### F2 — `/board/:examId` — Public Scoreboard (optional)
**Features:** ranked leaderboard, search by name, score distribution chart (only if examiner makes it public).
**APIs used:** `GET /exams/:id/scoreboard`.

---

## PART 2 — PAGE-TO-ENDPOINT MASTER MATRIX

| Page | Endpoints |
|------|-----------|
| `/login` | `POST /auth/login`, `GET /auth/me`, `POST /auth/refresh` |
| `/otp` | `POST /auth/otp/request`, `POST /auth/otp/verify` |
| `/admin` | `GET /exams?status=LIVE`, `GET /exams?status=SCHEDULED`, `GET /evaluations/review-queue`, `GET /grievances?status=OPEN` |
| `/admin/exams` | `GET /exams`, `GET /exams/:id` |
| `/admin/proctoring` | `GET /exams?status=LIVE`, `GET /proctor/live` |
| `/examiner` | `GET /exams`, `GET /evaluations/review-queue`, `GET /grievances` |
| `/examiner/exams/create` | `POST /exams` |
| `/examiner/exams/:id` | `GET /exams/:id`, `PATCH /exams/:id`, `POST /exams/:id/publish`, `POST /exams/:id/close` |
| `/examiner/exams/:id/questions` | `GET /questions`, `PATCH /exams/:id` |
| `/examiner/questions` | `GET /questions` |
| `/examiner/questions/new` | `POST /questions`, `PATCH /questions/:id` |
| `/examiner/questions/import` | `POST /questions/bulk/preview`, `POST /questions/bulk/commit` |
| `/examiner/questions/ai-generate` | `POST /questions/ai-draft`, `POST /questions` |
| `/examiner/exams/:id/grading` | `GET /evaluations/review-queue`, `POST /evaluations/:id/approve`, `POST /evaluations/:id/override` |
| `/examiner/exams/:id/results` | `POST /exams/:id/results/publish`, `GET /exams/:id/scoreboard`, `GET /sessions/:id/report` |
| `/examiner/grievances` | `GET /grievances`, `POST /grievances/:id/resolve` |
| `/monitor` | `GET /exams?status=LIVE` |
| `/monitor/:examId` | `GET /proctor/live`, `WS /ws/proctor`, `POST /sessions/:id/flag`, `POST /sessions/:id/extend-time`, `POST /sessions/:id/events` |
| `/exams/:examId/roster` (admin) | `POST /exams/:examId/roster`, `GET /exams/:examId/enrolments`, `DELETE /exams/:examId/enrolments/:userId` |
| `/exams` (student) | `GET /exams`, `GET /auth/me` |
| `/exams/:id/register` | `POST /exams/:examId/register` |
| `/exams/:id/check` | `POST /sessions/:examId/precheck` |
| `/exam/:examId` | `POST /sessions/:examId/start`, `GET /sessions/:id/next-item`, `POST /sessions/:id/answer`, `POST /sessions/:id/heartbeat`, `POST /sessions/:id/submit`, `WS /ws/proctor` |
| `/exam/:examId/resume` | `POST /sessions/:examId/resume` |
| `/results/:sessionId` | `GET /sessions/:id/report`, `GET /exams/:id/scoreboard` |
| `/results/:sessionId/dispute` | `POST /results/:id/grievance` |
| `/r/:examId` | `POST /auth/otp/*`, `POST /exams/:examId/register` |
| `/board/:examId` | `GET /exams/:id/scoreboard` |

---

## PART 3 — RECOMMENDED FOLDER STRUCTURE

```
examfar-fe/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── otp/page.tsx
│   ├── (admin)/
│   │   ├── layout.tsx                    # sidebar + topbar shell
│   │   ├── admin/
│   │   │   ├── page.tsx                   # overview
│   │   │   ├── exams/page.tsx
│   │   │   ├── users/page.tsx
│   │   │   ├── proctoring/page.tsx
│   │   │   ├── audit/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── examiner/
│   │   │   ├── page.tsx
│   │   │   ├── exams/
│   │   │   │   ├── create/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx           # detail (tabs)
│   │   │   │       ├── questions/page.tsx
│   │   │   │       ├── grading/page.tsx
│   │   │   │       └── results/page.tsx
│   │   │   ├── questions/
│   │   │   │   ├── page.tsx               # bank
│   │   │   │   ├── new/page.tsx
│   │   │   │   ├── import/page.tsx
│   │   │   │   └── ai-generate/page.tsx
│   │   │   └── grievances/page.tsx
│   │   └── monitor/
│   │       ├── page.tsx
│   │       └── [examId]/page.tsx
│   ├── (exam)/
│   │   ├── exams/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── register/page.tsx
│   │   │       └── check/page.tsx
│   │   ├── exam/
│   │   │   ├── [examId]/
│   │   │   │   ├── page.tsx               # runner (locked mode)
│   │   │   │   └── resume/page.tsx
│   │   │   └── submitted/page.tsx
│   │   └── results/
│   │       └── [sessionId]/
│   │           ├── page.tsx
│   │           └── dispute/page.tsx
│   └── (public)/
│       ├── r/[examId]/page.tsx
│       └── board/[examId]/page.tsx
├── components/
│   ├── ui/                               # shadcn primitives
│   ├── exam/                             # ExamTimer, QuestionRenderer, AnswerInput
│   ├── proctor/                          # CandidateCard, RiskBadge, EventTimeline
│   ├── questions/                        # RubricBuilder, OptionEditor, ImportPreview
│   └── charts/                           # ScoreDistribution, RiskHeatmap
├── lib/
│   ├── api/
│   │   ├── client.ts                     # axios + interceptors (auth, refresh, unwrap)
│   │   ├── auth.ts  exams.ts  questions.ts  sessions.ts  proctor.ts  results.ts
│   ├── ws/socket.ts                      # socket.io client factory
│   ├── hooks/                            # useExam, useSession, useHeartbeat, useProctorFeed
│   ├── store/                            # zustand: useExamStore, useAuthStore
│   └── schemas/                          # zod (mirror backend DTOs)
├── middleware.ts                         # route-group RBAC redirects
└── env.d.ts
```

---

## PART 4 — KEY REUSABLE COMPONENTS

| Component | Used by | What it does |
|-----------|---------|--------------|
| `ExamTimer` | E4, E5 | Counts down from server `remainingSeconds`, re-syncs on each heartbeat, warns < 60s |
| `QuestionRenderer` | E4 | Renders any question type from `next-item`; never receives the answer key |
| `AnswerInput` | E4 | Type-aware input (radio, checkbox, textarea, numeric, code) → builds the `answer` payload |
| `RubricBuilder` | C6 | Criterion + max-marks editor for subjective questions |
| `OptionEditor` | C6 | MCQ option list with correct-answer marking |
| `ImportPreview` | C7 | Green/red row table from `bulk/preview` response |
| `DraftCard` | C8 | Editable AI-generated question card with Save/Discard |
| `CandidateCard` | D2 | Live risk badge + event timeline, patched by WS updates |
| `RiskBadge` | D2, B4 | LOW/MEDIUM/HIGH colored pill from risk bucket |
| `EventTimeline` | D2 | Chronological proctoring events with severity/confidence |
| `ScoreboardTable` | C10, E7, F2 | Ranked results with own-row highlight |
| `ConfidenceBar` | C9 | Visual AI-confidence indicator in the grading queue |
| `GradePanel` | C9 | Split answer/rubric override editor with live total |

---

## PART 5 — CRITICAL FRONTEND PATTERNS (must-implement)

1. **Server-authoritative timer.** The exam clock is `remainingSeconds` from the backend (start + every heartbeat). Never compute deadlines on the client — clock drift and tab-throttling will cheat or cheat the student.

2. **Idempotent answer submission.** Generate one `clientNonce` per question. On network failure, retry the POST with the **same** nonce. The backend dedupes — zero risk of double-scoring.

3. **Offline-first answers.** Write each answer to `localStorage` *before* the POST. Show "Saving… / Saved ✓ / Retrying…". On reconnect, flush any unsent answers.

4. **WebSocket with REST fallback (both sides).** Student emits proctoring events over WS; if WS is down, queue and batch via `POST /sessions/:id/events`. Invigilator subscribes via WS; if down, poll `GET /proctor/live` every 5s.

5. **Resume on reload.** On portal/exam-route load, check for an active session and offer Resume via `POST /sessions/:examId/resume` — never restart the timer from full.

6. **Adaptive UX guardrails.** In ADAPTIVE mode: no Previous button, upfront warning, auto-submit when `next-item` returns `{ done: true }`.

7. **RBAC-aware UI.** `middleware.ts` redirects wrong-role users away from route groups; decoded JWT hides buttons. Backend is the real gate — UI just avoids dead-ends.

8. **Optimistic + invalidate.** Grading approve/override and grievance resolve use optimistic updates, then `queryClient.invalidateQueries` to reconcile with the server (scoreboard auto-re-ranks on upheld grievance).

9. **Single source of response shape.** One axios interceptor unwraps `{ success, data }` and throws `{ code, message }` — every hook gets clean data or a typed error.

10. **Fullscreen lock + tamper signals.** The exam runner requests fullscreen; exiting fullscreen, tab blur, copy/paste, and devtools-open all emit proctoring events (warn, never auto-fail).

---

## PART 6 — BUILD ORDER (suggested sprint plan)

| Sprint | Deliverable | Pages |
|--------|-------------|-------|
| 1 | Auth + API client + layouts | A1, A2, shells |
| 2 | Exam authoring | C2, C3, C5, C6 |
| 3 | Question tooling | C7, C8, C4 |
| 4 | Student exam runner (the crown jewel) | E3, E4, E5, E6 |
| 5 | Proctoring live wall | D1, D2 |
| 6 | Grading + results + grievances | C9, C10, C11, E7, E8 |
| 7 | Admin overview + public pages + polish | B1–B6, F1, F2 |

---

*Pairs with `TEAM_GUIDE.md` (backend file & API reference). Last updated: June 2026 | ExamFar Frontend v1.0*
