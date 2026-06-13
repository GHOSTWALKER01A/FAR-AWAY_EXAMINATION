# ExamFar Backend — Team Guide
### "What every file does, every API endpoint, and what the frontend screen should look like"

> Written for teammates who are new to the codebase. No jargon assumed.
> Read top-to-bottom once, then use as a reference while building.

---

## PART 1 — THE BIG PICTURE (read this first)

We have **two backend servers** running together:

```
Browser / Mobile App
       │
       ▼
┌─────────────────────────────┐
│   NestJS  (port 3000)        │  ← The main server. Handles everything:
│   TypeScript + Postgres      │    login, exams, student sessions,
│   + Redis + BullMQ           │    proctoring events, results, disputes
└─────────────┬───────────────┘
              │ calls internally (never exposed to browser)
              ▼
┌─────────────────────────────┐
│   FastAPI   (port 8000)      │  ← The AI brain. Only NestJS talks to it.
│   Python                     │    Does: adaptive question selection,
│                              │    LLM grading, question generation
└─────────────────────────────┘
```

**Why two servers?**
- NestJS is great at web APIs, real-time sockets, database transactions.
- Python is great at math (IRT exam algorithm) and AI (Claude API for grading).
- If the AI server crashes, students can still take exams — NestJS has a local fallback.

**Three databases:**
- **PostgreSQL** — permanent storage (exams, students, answers, results). The source of truth.
- **Redis** — fast temporary storage (live session state, who's online, exam timers).
- **BullMQ** (runs inside Redis) — job queue for slow tasks like AI grading (runs in background, never blocks the student).

---

## PART 2 — EVERY FILE EXPLAINED

### Root files

| File | What it does | Why it exists |
|------|-------------|---------------|
| `docker-compose.yml` | Starts all 4 containers (Postgres, Redis, NestJS, FastAPI) with one command | So any teammate can run the whole stack with `docker compose up` |
| `.env` | Stores secrets (DB password, Redis password, API keys) | Never hardcode secrets in code files |

---

### `apps/core-api/` — The NestJS Server

#### Top-level files

| File | What it does | Why it exists |
|------|-------------|---------------|
| `Dockerfile` | Instructions for building the NestJS server into a Docker container | Reproducible deployment |
| `package.json` | Lists all Node.js libraries the project needs | npm reads this to install dependencies |
| `tsconfig.json` | TypeScript compiler settings | Tells TypeScript how strict to be and where to output compiled files |
| `.env` | Environment variables for this server specifically | DB connection string, JWT secret, AI service URL, etc. |

#### `prisma/` — Database

| File | What it does | Why it exists |
|------|-------------|---------------|
| `schema.prisma` | The **complete database blueprint** — defines every table, every column, every relationship | Prisma reads this to create/update the actual Postgres tables |
| `seed.ts` | Fills the database with sample data on first run | So developers have something to test with immediately |

**Tables created :**
- `institutions` — The school/college using the platform
- `users` — Everyone: admins, teachers, invigilators, students
- `exams` — The exam itself (title, mode, duration, config)
- `exam_sections` — Sub-sections within an exam (e.g. Physics, Chemistry, Math)
- `questions` — The question bank (versioned — editing a used question creates a new version, never overwrites)
- `exam_questions` — Which questions are in which exam
- `enrolments` — Which student is registered for which exam
- `exam_sessions` — A student's live exam attempt (timer, current progress, adaptive state)
- `responses` — Every answer a student submits (append-only — never deleted, like a ledger)
- `proctoring_events` — Every suspicious event during an exam (tab switch, face missing, etc.)
- `session_risk_scores` — The computed cheating-risk score for a session
- `evaluations` — The grade given for each answer (auto, AI, or human)
- `results` — Final score, rank, percentile for a session
- `grievances` — Student disputes on their results
- `audit_logs` — Every important action ever taken (tamper-evident trail)

---

#### `src/` — Application Code

##### `main.ts` — Server Boot
**What it does:** The very first file that runs when the server starts.
Sets up: global error handling, CORS (which websites can talk to this API), WebSocket adapter (for real-time proctoring), graceful shutdown.
**Why:** One place to configure everything that applies to the whole app.

##### `app.module.ts` — The Master Wiring File
**What it does:** Imports and connects every feature module. Think of it as the table of contents for all features.
**Why:** NestJS requires every feature to be declared here before it works.

##### `config/configuration.ts` — Environment Validator
**What it does:** Reads all environment variables and validates them with Zod. If a required variable is missing, **the server refuses to start** and prints a clear error.
**Why:** Better to crash at boot with a clear message than to crash in production mid-exam because `DATABASE_URL` was missing.

---

##### `common/` — Shared Utilities (used by every feature)

| File | What it does in plain English |
|------|-------------------------------|
| `guards/auth.guard.ts` | The bouncer. Every request passes through here. It reads the JWT token, checks the user's role, and decides if they're allowed to proceed. If not → 401 or 403. |
| `decorators/auth.decorator.ts` | Two helpers: `@AuthUser()` (gets the logged-in user from the request) and `@Require('permission')` (marks an endpoint as needing a specific permission) |
| `filters/all-exceptions.filter.ts` | Catches every error thrown anywhere in the app and formats it into a consistent JSON response `{success: false, error: {code, message}}` instead of an ugly crash |
| `interceptors/response.interceptor.ts` | Wraps every successful response in `{success: true, data: ..., timestamp: ...}` so the frontend always gets the same shape |
| `pipes/zod-validation.pipe.ts` | Validates request body against a Zod schema. If the data is wrong shape, returns a 400 with field-level errors before the code even runs |

---

##### `prisma/` — Database Connection

| File | What it does |
|------|-------------|
| `prisma.service.ts` | The database client. Every service injects this to run queries. Connects on startup, disconnects on shutdown. |
| `prisma.module.ts` | Makes PrismaService available to every other module automatically (marked `@Global`) |

##### `redis/` — Fast Storage & Locks

| File | What it does |
|------|-------------|
| `redis.service.ts` | Connects to Redis. Provides: session state storage (θ value, served items, deadline), monotonic sequence counter for answers, temporary preview stash for bulk imports |
| `redis.module.ts` | Makes Redis available globally |
| `lock.service.ts` | Manages the "single active session" lock. When a student starts an exam, their device token is stored in Redis. If they try on a second device, the heartbeat detects a token mismatch and returns 409. |

##### `ai/` — Bridge to FastAPI

| File | What it does |
|------|-------------|
| `ai.client.ts` | The HTTP client that NestJS uses to talk to the Python server. Every call is HMAC-signed (security), has a timeout, retries with exponential backoff, and has a circuit breaker (if Python is down, it stops hammering it for 15 seconds). Hot path calls (live exam next-item) have a 3-second timeout with a local fallback so students are never blocked. |
| `ai.module.ts` | Makes AiClient available to other modules |

##### `queue/` — Background Jobs

| File | What it does |
|------|-------------|
| `queue.module.ts` | Sets up 4 BullMQ queues: grading, generation, calibration, notification |
| `processors/grading.processor.ts` | The worker that runs after a student submits. Gets the latest answer per question, tallies objective scores, calls FastAPI to grade subjective answers, writes the provisional result. Runs in the background — student doesn't wait for this. |
| `processors/calibration.processor.ts` | After results are published, questions with enough responses get sent for IRT parameter calibration (so the adaptive engine gets smarter over time) |

---

##### `modules/` — Feature Modules (one per domain)

Each module has the same structure: `module.ts` (wiring) + `controller.ts` (HTTP routes) + `service.ts` (business logic).

**`auth/`**
- `auth.service.ts` — Handles login (bcrypt compare), token generation (JWT access + refresh), OTP generation and verification. Generic error on bad credentials (no user enumeration attack possible).
- `auth.controller.ts` — Routes: POST /auth/login, /auth/refresh, /auth/otp/request, /auth/otp/verify, GET /auth/me

**`exams/`**
- `exams.service.ts` — Create/update/publish/close exams. Validates that a fixed exam has questions before publishing. Validates time window. Has a `@Cron` method that runs every 30 seconds to auto-activate scheduled exams (no human needed to click "go live").
- `exams.controller.ts` — All exam management routes (admin/examiner only)

**`questions/`**
- `questions.service.ts` — Create questions (validates rubric required for subjective). Update with version-on-edit (if the question was used in a live exam, creates a new version instead of mutating). Bulk import (two-phase: preview → commit, rows stashed in Redis). AI draft (calls FastAPI, returns drafts for human review — never auto-saves).
- `questions.controller.ts` — Question bank management routes (examiner only)

**`enrolment/`**
- `enrolment.service.ts` — Roster import (CSV, row-level errors, continues on partial failures). Self-registration (checks seat cap → waitlist if full). Auto-promotes waitlisted student when another cancels.
- `enrolment.controller.ts` — Registration routes (roster for admins, self-register for students)

**`sessions/`** ← The most complex module
- `sessions.service.ts` — The entire exam-taking engine:
  - `precheck()` — Verifies camera/network/identity before allowing entry
  - `start()` — Single-active-session lock, computes server-authoritative deadline (including accessibility extra time), creates session
  - `nextItem()` — For FIXED: serves in order. For ADAPTIVE: calls FastAPI for IRT-based selection (with local ELO fallback if FastAPI is down). For RANDOMISED: draws from bank respecting blueprint.
  - `answer()` — Append-only response storage with idempotency (same nonce = return cached result, don't double-insert). Objective questions graded immediately. Adaptive θ updated via FastAPI.
  - `heartbeat()` — Keeps session alive, detects device token mismatch (second device → 409). Returns remaining seconds.
  - `resume()` — After disconnect: takes over the lock, session continues from exact state.
  - `submit()` — Finalises session, enqueues grading job (idempotent job ID prevents double-grading).
  - `reapStale()` — Cron every 20s: marks sessions with no recent heartbeat as DISCONNECTED; marks past-deadline sessions as EXPIRED.

**`proctoring/`**
- `proctoring.gateway.ts` — WebSocket server. Candidates connect and emit events (tab_switch, face_missing, etc.). Gateway validates timestamps (rejects spoofed times), saves events, recomputes risk score, fans out to invigilators watching the exam's room. Returns a warn flag to the candidate on first escalation — never auto-fails anyone.
- `risk.service.ts` — Computes the weighted risk score from all events. Each signal type has a configurable weight. Confidence-weighted (low-light camera events count less). Outputs LOW/MEDIUM/HIGH bucket.
- `proctoring.controller.ts` — REST fallback for when WebSocket drops, live feed for invigilators, flag session, extend time.
- `redis-io.adapter.ts` — Makes WebSockets work across multiple NestJS instances via Redis pub/sub (so any server can receive events for any session).

**`evaluation/`**
- `evaluation.service.ts` — Human review queue (sorted by lowest AI confidence first). Approve an AI grade. Override with a human grade.

**`results/`**
- `results.service.ts` — Publish results: sorts all session results by marks (deterministic tie-break), assigns rank + percentile, marks exam as RESULTS_PUBLISHED. Scoreboard. Individual report (only own session or admin/examiner).

**`grievance/`**
- `grievance.service.ts` — Student raises a dispute on a question. Examiner reviews. If upheld: re-runs ranking across all sessions for that exam so scoreboard updates automatically.

---

### `apps/ai-svc/` — The Python AI Server

| File | What it does |
|------|-------------|
| `app/main.py` | FastAPI app boot. Registers 4 routers, all protected by HMAC auth. |
| `app/security.py` | Verifies every request from NestJS using HMAC-SHA256 signature + timestamp (rejects requests older than 5 minutes to prevent replay attacks). |
| `app/schemas.py` | Pydantic models — the shape of every request and response for all 4 routers |
| `app/config.py` | Settings (model names, ensemble size) read from env |
| `app/services/irt.py` | The IRT/CAT math engine: `p_correct()` (2PL/3PL probability), `item_information()` (Fisher information), `estimate_theta_mle()` (Newton-Raphson MLE — estimates student ability after each answer, handles all-correct/all-wrong edge cases), `select_next_item()` (randomesque top-N selection — prevents item overexposure/leakage), `should_stop()` (precision/count stopping rules) |
| `app/services/llm.py` | Anthropic Claude wrapper. Forces structured output via tool use (the model MUST call a tool with JSON — can never return free text). Includes prompt-injection defense (student answer is framed as data, never as instructions). |
| `app/services/grader.py` | Runs N grading passes (ensemble). Takes the median awarded marks. Confidence = (1 − inter-judge spread) × minimum self-confidence. Blank answers short-circuit to 0 (no LLM call). |
| `app/services/generator.py` | Generates question drafts and tags them AI provenance. NestJS enforces human review before saving. |
| `app/routers/adaptive.py` | `/adaptive/select` and `/adaptive/theta` endpoints |
| `app/routers/grading.py` | `/grading/subjective` endpoint |
| `app/routers/generation.py` | `/generation` endpoint |
| `app/routers/embeddings.py` | `/embeddings/embed` endpoint (stub — wire up sentence-transformers for dedup) |

---

## PART 3 — ALL API ENDPOINTS

Base URL: `http://localhost:3000/api/v1`

All responses have this shape:
```json
{ "success": true, "data": {...}, "timestamp": "2026-06-13T..." }
{ "success": false, "error": { "code": 400, "message": "..." } }
```
All protected routes require: `Authorization: Bearer <accessToken>`

---

### DASHBOARD 1 — AUTHENTICATION (No login required)

These endpoints exist on every page (login screen, OTP screen).

---

#### `POST /auth/login`
**What it does:** Email + password login. Returns access token (15 min) + refresh token (30 days).
**Who uses it:** Admin, Examiner, Invigilator (students use OTP).
**Request:**
```json
{ "email": "admin@demo.edu", "password": "Password123!" }
```
**Response:**
```json
{ "accessToken": "eyJ...", "refreshToken": "eyJ..." }
```
**Edge cases handled:** Generic "Invalid credentials" error regardless of whether the email exists (prevents user enumeration attacks).

**Frontend screen:** Standard login form — two fields (email, password), submit button. On success, store both tokens (access in memory, refresh in HttpOnly cookie ideally). Redirect to dashboard based on role from decoded JWT.

---

#### `POST /auth/otp/request`
**What it does:** Sends a 6-digit OTP to the student's email.
**Who uses it:** Students registering for or logging into an exam.
**Request:** `{ "email": "student@college.edu" }`
**Response:** `{ "sent": true }`

**Frontend screen:** "Enter your email to get an OTP" field + button. Show a loading spinner, then "OTP sent — check your email."

---

#### `POST /auth/otp/verify`
**What it does:** Verifies the OTP, creates the user if they don't exist, returns tokens.
**Who uses it:** Students.
**Request:** `{ "email": "student@college.edu", "otp": "483920" }`
**Response:** Same as login — `{ accessToken, refreshToken }`

**Frontend screen:** 6-digit OTP input (or 6 individual boxes for UX). Auto-submit when all 6 filled. On wrong OTP → shake animation + "Invalid OTP."

---

#### `POST /auth/refresh`
**What it does:** Use the refresh token to get a new access token (called silently in the background when access token expires).
**Who uses it:** Frontend token refresh logic (Axios interceptor pattern).

---

#### `GET /auth/me`
**What it does:** Returns the currently logged-in user's claims (role, institutionId, permissions).
**Who uses it:** Frontend on app load to restore user context.

---

### DASHBOARD 2 — ADMIN / EXAMINER — EXAM MANAGEMENT

Screen: "My Exams" list + "Create Exam" form + "Exam Settings" panel.

---

#### `POST /exams`
**What it does:** Creates a new exam in DRAFT status.
**Permission:** `exam.create` (Examiner, Admin)
**Request:**
```json
{
  "title": "JEE Mock Test 1",
  "description": "Full syllabus mock",
  "mode": "ADAPTIVE",
  "registrationType": "PRE_REGISTERED",
  "durationSeconds": 10800,
  "startAt": "2026-07-01T09:00:00Z",
  "endAt": "2026-07-01T12:00:00Z",
  "seatCap": 500,
  "markingConfig": { "negativePenalty": 0.25 },
  "adaptiveConfig": { "seTarget": 0.3, "minItems": 10, "maxItems": 40 },
  "proctoringConfig": { "requireCamera": true, "weights": { "TAB_SWITCH": 0.15 } }
}
```
**mode options:** `ADAPTIVE` | `FIXED` | `RANDOMISED`

**Frontend screen:** Multi-step form wizard:
- Step 1: Basic info (title, description, mode selector with visual explanation of each)
- Step 2: Time settings (date/time pickers for start, end, optional scheduled-publish time)
- Step 3: Marking rules (marks per question, negative marking toggle + penalty ratio)
- Step 4: Proctoring config (camera required toggle, which signals to monitor and their weights)
- Step 5: Review & save as draft

---

#### `PATCH /exams/:id`
**What it does:** Updates an exam. Only works while it's in DRAFT status.
**Permission:** `exam.configure`

**Frontend:** "Edit Exam" button on the exam detail page, same form as create but pre-filled. Disabled once exam is LIVE.

---

#### `POST /exams/:id/publish`
**What it does:** Publishes the exam. If `publishAt` is in the future → status becomes SCHEDULED (auto-activates later). If no `publishAt` → LIVE immediately.
**Permission:** `exam.publish`
**Validations run:** Has questions / valid blueprint, time window valid, marking config sane.

**Frontend:** Big "Publish" button on the exam detail page. Show a confirmation modal: "This exam will go live at [time]. You cannot edit it after this." On success → status badge changes to LIVE or SCHEDULED.

---

#### `POST /exams/:id/close`
**What it does:** Stops accepting new sessions. In-progress sessions finish their remaining time.
**Permission:** `exam.publish`

**Frontend:** "End Exam Early" button (destructive action, red, with confirmation dialog).

---

#### `GET /exams`
**What it does:** Lists all exams for the institution with pagination and filters.
**Query params:** `?status=LIVE&mode=ADAPTIVE&page=1&limit=20`

**Frontend screen:** Exam list/table with columns: Title, Mode (chip), Status (colored badge), Start time, Students enrolled, Actions. Filter bar at top. "Create Exam" button top-right.

---

#### `GET /exams/:id`
**What it does:** Gets full exam details including sections.

**Frontend:** Exam detail page showing all config, a tab for questions, a tab for enrolled students, a tab for results.

---

### DASHBOARD 3 — QUESTION BANK

Screen: "Question Bank" with list, search, filters, and "Add Question" actions.

---

#### `POST /questions`
**What it does:** Creates a single question manually.
**Permission:** `question.author`
**Request:**
```json
{
  "type": "MCQ",
  "stem": "Which planet is closest to the Sun?",
  "options": [{"id":"a","text":"Venus"},{"id":"b","text":"Mercury"},{"id":"c","text":"Mars"},{"id":"d","text":"Earth"}],
  "correctKey": { "optionIds": ["b"] },
  "marks": 4,
  "difficulty": "EASY",
  "topicTags": ["astronomy", "solar-system"]
}
```
For subjective (`SHORT`/`LONG`):
```json
{
  "type": "LONG",
  "stem": "Explain Newton's Second Law with an example.",
  "marks": 10,
  "rubric": {
    "criteria": [
      {"criterion": "States the law correctly", "max": 3},
      {"criterion": "Provides a valid real-world example", "max": 4},
      {"criterion": "Mathematical representation", "max": 3}
    ]
  }
}
```

**Frontend screen:** "Add Question" modal or full-page form. Question type selector (MCQ, Multi-Select, Short, Long, Numeric, Code). Dynamic form that shows: options section for MCQ, rubric builder for subjective, difficulty selector (Easy/Medium/Hard), topic tags input, marks input.

---

#### `PATCH /questions/:id`
**What it does:** Edits a question. If it's used in an active exam, creates a new version (old answer records stay linked to the old version — historical integrity preserved).

**Frontend:** Edit button on question card. If the question is "in use," show a warning: "Editing this will create a new version. Existing exam records will not be affected."

---

#### `POST /questions/bulk/preview`
**What it does:** Phase 1 of bulk import. Upload a CSV file. Returns a parse report showing which rows are valid and which have errors. Does NOT save anything yet.
**Request:** `multipart/form-data` with field `file` (CSV)
**Response:**
```json
{
  "previewId": "abc123",
  "total": 50,
  "valid": 47,
  "errors": [
    {"row": 3, "error": "Missing stem"},
    {"row": 18, "error": "Invalid type: 'quiz'"},
    {"row": 22, "error": "Missing stem"}
  ]
}
```

**Frontend:** Drag-and-drop CSV upload zone. After upload → show a preview table with green/red rows. Errors highlighted. "Import 47 valid questions" button + "Download error report" link.

---

#### `POST /questions/bulk/commit`
**What it does:** Phase 2 of bulk import. Confirms the valid rows and saves them to the database.
**Request:** `{ "previewId": "abc123" }` (the ID from the preview step)
**Response:** `{ "committed": 47 }`

Note: The preview data expires after 10 minutes in Redis. If the user waits too long → "Preview expired, re-upload."

---

#### `POST /questions/ai-draft`
**What it does:** Asks the AI to draft exam questions on a topic. Returns drafts for human review. **Does NOT save them automatically.**
**Request:**
```json
{ "topic": "Thermodynamics", "count": 5, "difficulty": "HARD", "type": "MCQ", "language": "English" }
```
**Response:**
```json
{
  "drafts": [
    { "stem": "...", "options": [...], "correctKey": {...}, "difficulty": "HARD", "provenance": "AI" }
  ],
  "note": "Review and edit before saving. AI provenance will be flagged."
}
```

**Frontend:** "Generate with AI" button opens a panel: topic input, count slider (1–20), difficulty selector, question type. Show the drafts as editable cards. Each card has "Save to bank" and "Discard" buttons. AI-generated badge on each card.

---

#### `GET /questions`
**What it does:** Lists questions from the bank with filters.
**Query params:** `?difficulty=HARD&topic=thermodynamics&calibration=CALIBRATED&page=1&limit=50`

**Frontend:** Table/grid with search bar, filter chips (difficulty, topic, type, calibration status). Pagination. Each row: stem preview, type, difficulty, marks, usage count, edit/delete actions.

---

### DASHBOARD 4 — STUDENT REGISTRATION / ROSTER

Screen: "Enrolled Students" tab on the exam detail page.

---

#### `POST /exams/:examId/roster`
**What it does:** Bulk imports students from a CSV file. Returns row-level errors — valid rows are imported even if some rows fail.
**CSV format:** `name,email,phone`
**Response:**
```json
{ "created": 148, "errors": [{"row": 7, "error": "Invalid email"}, {"row": 23, "error": "Duplicate in file"}] }
```

**Frontend:** "Import Roster" button → drag-drop CSV. After upload → "148 students added. 2 rows had errors." + downloadable error log.

---

#### `POST /exams/:examId/register`
**What it does:** Student self-registers for an open exam (after OTP verification). If seats are full → added to waitlist.
**Request:** `{ "name": "Priya Sharma", "email": "priya@college.edu", "phone": "9876543210" }`
**Response:** `{ "status": "ENROLLED" }` or `{ "status": "WAITLISTED" }`

**Frontend:** Public registration page for the exam. Shows "X seats remaining." After submit → confirmation page with slot time and joining instructions. If waitlisted → "You're on the waitlist. We'll email you if a seat opens."

---

#### `GET /exams/:examId/enrolments`
**What it does:** Lists all enrolled/waitlisted students for an exam.

**Frontend:** Student table in admin panel with columns: Name, Email, Status (Enrolled/Waitlisted/Absent/Cancelled), Slot time. Sortable. Bulk action: mark absent, remove.

---

#### `DELETE /exams/:examId/enrolments/:userId`
**What it does:** Cancels a student's enrolment. Automatically promotes the first waitlisted student to enrolled.

**Frontend:** "Remove" button on each student row. Confirmation dialog. On success → first waitlisted student's row changes to "Enrolled."

---

### DASHBOARD 5 — STUDENT — EXAM ENTRY

This is the **student-facing exam portal**. Separate app/route from the admin panel.

---

#### `POST /sessions/:examId/precheck`
**What it does:** The "readiness gate" before the exam starts. Checks that camera is available, browser is compatible, network is OK.
**Request:**
```json
{ "cameraGranted": true, "networkOk": true, "browserCompatible": true }
```
**Response:**
```json
{ "examLive": true, "cameraRequired": true, "cameraGranted": true, "networkOk": true, "browserCompatible": true }
```
If `cameraRequired: true` and `cameraGranted: false` → 400 error "Camera permission required."

**Frontend screen:** "System Check" page before the exam. Shows a checklist:
- ✅ Camera: Detected and working (live preview thumbnail)
- ✅ Microphone: Working
- ✅ Network: Good (speed test result)
- ✅ Browser: Chrome 124 — Supported
- ✅ Full screen: Required — click "Enter Fullscreen"
"Start Exam" button is disabled until all checks pass.

---

#### `POST /sessions/:examId/start`
**What it does:** Officially starts the exam. Sets the server-authoritative deadline, creates the session record, acquires the single-active-session lock.
**Request:** `{ "deviceToken": "unique-device-id-123" }`
**Response:**
```json
{ "sessionId": "uuid", "deadlineAt": "2026-07-01T12:15:00Z", "remainingSeconds": 10800 }
```
**Frontend:** After precheck passes, "Start Exam" posts here. Store `sessionId` and `deadlineAt`. Start the countdown timer using `remainingSeconds` from the server.

---

#### `GET /sessions/:id/next-item`
**What it does:** Gets the next question the student should answer.
- **FIXED mode:** Returns questions in the order set by the examiner.
- **ADAPTIVE mode:** The server calls FastAPI to pick the question that gives the most information about the student's ability level, based on their performance so far. Returns `{ done: true }` when the adaptive stopping rule is met.
- **RANDOMISED mode:** Draws from the bank per the exam blueprint.

**Response:**
```json
{
  "id": "question-uuid",
  "stem": "What is the speed of light?",
  "type": "MCQ",
  "options": [{"id":"a","text":"3×10⁸ m/s"},{"id":"b","text":"3×10⁶ m/s"},...],
  "marks": 4,
  "difficulty": "MEDIUM"
}
```
(correctKey is NEVER sent to the client)

**Frontend:** Shows the question with the answer options. Adaptive mode note: students cannot go back (next item is chosen based on the current answer, so going back would invalidate the algorithm). Fixed/Randomised modes can optionally allow review.

---

#### `POST /sessions/:id/answer`
**What it does:** Submits an answer for a question. Append-only (every answer is stored, latest wins). Idempotent (submitting the same answer twice returns the same result without double-inserting).

**Request:**
```json
{
  "questionId": "question-uuid",
  "answer": { "optionIds": ["a"] },
  "timeSpentMs": 45000,
  "clientNonce": "unique-client-generated-id"
}
```
For text answers: `"answer": { "text": "Newton's second law states F=ma..." }`

**Response:** `{ "accepted": true }` or `{ "accepted": true, "deduped": true }` (if it was a duplicate submit)

**Frontend:** When student clicks an option and presses "Next" (or "Submit Answer"). The `clientNonce` should be generated fresh for each question (e.g., `sessionId + questionId + timestamp`). Show a loading indicator on the button during the request. On network error → retry with the SAME nonce (idempotency ensures no double-submit).

---

#### `POST /sessions/:id/heartbeat`
**What it does:** Called every 10–15 seconds by the frontend to keep the session alive and get updated remaining time (server is the source of truth for the timer).
**Request:** `{ "deviceToken": "unique-device-id-123" }`
**Response:** `{ "remainingSeconds": 5432 }`
**Error:** 409 if another device has taken the session.

**Frontend:** A silent background interval. If it fails 3 times in a row → show "Connection lost" banner. If 409 → show "Your session is open on another device. Please close it there." If `remainingSeconds` < 60 → show warning.

---

#### `POST /sessions/:examId/resume`
**What it does:** Resumes a session after a disconnect or browser crash. The timer continues from where it was (server tracks the deadline, not the client).
**Request:** `{ "deviceToken": "new-device-id-456" }`
**Response:** `{ "sessionId": "uuid", "remainingSeconds": 4821, "answeredCount": 12 }`

**Frontend:** On page load, check if there's an active session for this exam. If yes → show "Resume Exam" button with remaining time. Don't restart the timer from 0 — use `remainingSeconds` from this endpoint.

---

#### `POST /sessions/:id/submit`
**What it does:** Finalises the exam. No more answers accepted after this. Kicks off the grading job in the background.
**Response:** `{ "submitted": true }`

**Frontend:** "Submit Exam" button. Confirmation modal: "You have answered X/Y questions. Are you sure you want to submit? You cannot go back." After submit → "Thank you! Your exam has been submitted. Results will be available once graded." Redirect to a waiting/result page.

---

### DASHBOARD 6 — INVIGILATOR — LIVE PROCTORING MONITOR

Screen: Real-time dashboard showing all live candidates with risk scores and event feeds.

---

#### `WebSocket /ws/proctor`
**How to connect (student):**
```javascript
const socket = io('http://localhost:3000/ws/proctor', {
  auth: { token: accessToken }
})
socket.emit('proctor:events', {
  sessionId: 'session-uuid',
  events: [
    { type: 'TAB_SWITCH', severity: 0.8, confidence: 1.0, occurredAt: new Date().toISOString() },
    { type: 'GAZE_AWAY', severity: 0.3, confidence: 0.7, occurredAt: new Date().toISOString(), payload: { gazeAngle: 35 } }
  ]
})
```
**How to connect (invigilator):**
```javascript
const socket = io('http://localhost:3000/ws/proctor', {
  auth: { token: invigToken },
  query: { examId: 'exam-uuid' }
})
socket.on('proctor:update', (data) => {
  // { sessionId, userId, score: 0.45, bucket: 'MEDIUM', latest: [...events] }
  // Update the invigilator dashboard
})
```

**Frontend (student side):** Invisible to the student — JavaScript event listeners running in the background that detect and emit events.
**Frontend (invigilator side):** A grid of candidate cards, each showing: name, current risk bucket (green/yellow/red badge), last event, a mini timeline of events. Sorted by risk (highest on top). Click a card to see the full event timeline + snapshots.

---

#### `POST /sessions/:id/events`
**What it does:** REST fallback for batching proctoring events when the WebSocket connection drops.
**Request:** `{ "events": [...] }` (same format as WS)
**Why:** Network is unreliable. If WS drops, the client should queue events and send them via REST as a batch.

---

#### `GET /proctor/live?examId=:id`
**What it does:** Gets the current live session list with risk scores for an exam (for initial page load, before WebSocket connection provides real-time updates).
**Permission:** `session.monitor`

**Frontend:** Call this on page load to populate the invigilator dashboard, then switch to WebSocket updates for real-time changes.

---

#### `POST /sessions/:id/flag`
**What it does:** Invigilator manually flags a session with a note. Logged in the audit trail.
**Permission:** `session.flag`
**Request:** `{ "note": "Student looked away repeatedly during Q12-Q15" }`

**Frontend:** "Flag Session" button on the candidate's card/detail view. Opens a text field for the note. Flagged sessions show a flag icon in the dashboard.

---

#### `POST /sessions/:id/extend-time`
**What it does:** Grants extra time to a candidate. Updates the server-authoritative deadline. Audited.
**Permission:** `session.extend_time`
**Request:** `{ "seconds": 300 }` (5 extra minutes)

**Frontend:** "Extend Time" button → number input for extra seconds/minutes → confirm. The candidate's remaining time counter updates on their next heartbeat.

---

### DASHBOARD 7 — EXAMINER — EVALUATION / GRADING

Screen: "Grading Queue" — a list of subjective answers waiting for human review.

---

#### `GET /evaluations/review-queue?examId=:id`
**What it does:** Returns subjective answer evaluations that have been AI-graded but need human approval. Sorted by lowest AI confidence first (most uncertain grades bubble to the top).
**Permission:** `evaluation.grade_manual`
**Response:**
```json
[
  {
    "id": "eval-uuid",
    "confidence": 0.45,
    "awarded": 6.5,
    "criteria": [{"criterion": "States the law correctly", "awarded": 3, "max": 3, "justification": "..."}],
    "response": {
      "answer": {"text": "Newton's second law states..."},
      "question": { "stem": "Explain Newton's Second Law...", "marks": 10 }
    }
  }
]
```

**Frontend:** A list/table of answers. Each row shows: question stem, student's answer (expandable), AI suggested grade, per-criterion breakdown, confidence score (shown as a bar). Sorted by confidence ascending. Click to expand full detail.

---

#### `POST /evaluations/:id/approve`
**What it does:** Approves the AI's suggested grade. Marks it as final.
**Permission:** `evaluation.override_ai`

**Frontend:** "Approve" button (green) on each evaluation row. One-click approval.

---

#### `POST /evaluations/:id/override`
**What it does:** Teacher disagrees with the AI grade and sets their own.
**Permission:** `evaluation.override_ai`
**Request:**
```json
{
  "awarded": 7.5,
  "criteria": [
    {"criterion": "States the law correctly", "awarded": 3, "max": 3, "justification": "Correct definition given"},
    {"criterion": "Real-world example", "awarded": 3.5, "max": 4, "justification": "Example partially correct"}
  ]
}
```

**Frontend:** "Override" button (orange) opens a grading panel. Shows: student answer on the left, rubric criteria on the right with editable score inputs for each criterion. Running total updates as they type. "Submit Override" saves.

---

### DASHBOARD 8 — RESULTS & SCOREBOARD

Screen: Public scoreboard + individual student reports.

---

#### `POST /exams/:id/results/publish`
**What it does:** Calculates and publishes final ranks and percentiles for all students. Changes exam status to RESULTS_PUBLISHED.
**Permission:** `evaluation.publish_results`

**Frontend:** "Publish Results" button (on exam detail, visible only to examiner/admin, only when grading is complete). Confirmation dialog. One-click.

---

#### `GET /exams/:id/scoreboard`
**What it does:** Returns the ranked list of all students.
**Response:**
```json
[
  { "rank": 1, "percentile": 99.5, "totalMarks": 312, "maxMarks": 360, "session": { "user": {"name": "Aryan Gupta"} } },
  { "rank": 2, "percentile": 98.1, "totalMarks": 308, "maxMarks": 360, "session": { "user": {"name": "Priya Sharma"} } }
]
```

**Frontend:** A leaderboard table. Columns: Rank, Name, Score, Percentage, Percentile. Search by name. Show the logged-in student's own row highlighted. Optional: score distribution histogram below the table.

---

#### `GET /sessions/:id/report`
**What it does:** Returns a student's individual result report — their answers, marks per question, and (when permitted) answer keys.
**Who can see it:** The student sees their own. Examiner/Admin can see anyone's.

**Frontend:** Student's personal result page. Shows: Overall score badge, rank, percentile. Section-wise breakdown. Then a per-question list: question stem, student's answer, whether it was correct, marks awarded, for subjective: the rubric breakdown and AI/human justification. Download as PDF button.

---

### DASHBOARD 9 — GRIEVANCE / DISPUTE

Screen: "Raise a Dispute" for students, "Dispute Management" for examiners.

---

#### `POST /results/:id/grievance`
**What it does:** Student raises a dispute on a specific question in their result.
**Who can use it:** Only the student who owns the result, only while results are FINAL.
**Request:**
```json
{ "questionId": "question-uuid", "reason": "The answer key is wrong — option B is also correct because..." }
```

**Frontend:** On the student's result report, each question has a "Raise Dispute" button (small, subtle). Opens a text area for the reason. Submit → "Your dispute has been submitted and will be reviewed by an examiner."

---

#### `GET /grievances?status=OPEN`
**What it does:** Lists all disputes for examiners to review.
**Permission:** `grievance.review`
**Query params:** `?status=OPEN` | `UPHELD` | `REJECTED`

**Frontend:** Examiner's "Disputes" page. Table: Student name, Question stem preview, Reason, Status badge, Date raised. Filter by status.

---

#### `POST /grievances/:id/resolve`
**What it does:** Examiner resolves the dispute. If upheld → optionally adjusts marks, then the entire exam's scoreboard is automatically re-ranked.
**Permission:** `grievance.review`
**Request:**
```json
{ "upheld": true, "note": "Option B is indeed also correct. Marking both B and A as valid.", "adjustedMarks": 8 }
```
**Response:** The updated grievance record.

**Frontend:** "Resolve Dispute" panel on the grievance detail. Two buttons: "Uphold" (green) and "Reject" (red). Uphold shows an optional marks adjustment field and a note field. On save → scoreboard badge updates across the exam automatically.

---

## PART 4 — FRONTEND ARCHITECTURE NOTES

### How the frontend should be structured (by role)

**Admin / Examiner app (separate login):**
- `/dashboard` — Overview stats (exams live, students online, pending gradings)
- `/exams` — Exam list
- `/exams/create` — Multi-step create form
- `/exams/:id` — Exam detail with tabs: Overview, Questions, Students, Results
- `/questions` — Question bank with search/filter
- `/proctor/:examId` — Live proctoring monitor (opens during active exam)
- `/grading/:examId` — Evaluation queue
- `/grievances` — Dispute management

**Student app:**
- `/login` — OTP-based login
- `/exams` — Available exams + enrolled exams
- `/exams/:id/register` — Self-registration page
- `/exams/:id/check` — System check (precheck)
- `/exam/:sessionId` — The actual exam interface (full screen, proctored)
- `/results/:sessionId` — Personal report
- `/results/:sessionId/dispute` — Raise dispute

**Invigilator app (can be part of admin app):**
- `/monitor/:examId` — Live proctoring dashboard

### Critical frontend patterns

1. **Timer:** Use `remainingSeconds` from the server's heartbeat response to sync the countdown. Don't trust the client clock for deadlines.

2. **Offline resilience:** Cache each answer in `localStorage` before POSTing. On network failure → retry with the same `clientNonce`. Show "Saving..." → "Saved ✓" → "Failed — retrying..." status.

3. **WebSocket reconnection:** Use socket.io's built-in reconnection, but also fall back to the REST `/sessions/:id/events` endpoint when WS is disconnected. Queue events in memory and flush when connection restores.

4. **Adaptive exam UX:** Since students can't go back in ADAPTIVE mode, make this very clear. Show "You cannot review previous questions in adaptive mode" before the exam starts. No "Previous" button in the exam UI.

5. **Session persistence:** On page refresh/browser crash, check `GET /sessions/:examId/resume` on load. If a session exists → show "Resume Exam" automatically.

---

## PART 5 — QUICK REFERENCE (Permissions vs Roles)

| Action | ADMIN | EXAMINER | INVIGILATOR | CANDIDATE |
|--------|-------|----------|-------------|-----------|
| Create exam | ✅ | ✅ | ❌ | ❌ |
| Publish exam | ✅ | ✅ | ❌ | ❌ |
| Manage question bank | ✅ | ✅ | ❌ | ❌ |
| Import roster | ✅ | ✅ | ❌ | ❌ |
| Monitor live sessions | ✅ | ✅ | ✅ | ❌ |
| Flag session | ✅ | ✅ | ✅ | ❌ |
| Extend time | ✅ | ✅ | ✅ | ❌ |
| Grade / override AI | ✅ | ✅ | ❌ | ❌ |
| Publish results | ✅ | ✅ | ❌ | ❌ |
| Resolve grievances | ✅ | ✅ | ❌ | ❌ |
| Take exam | ❌ | ❌ | ❌ | ✅ |
| View own result | ❌ | ❌ | ❌ | ✅ |
| Raise grievance | ❌ | ❌ | ❌ | ✅ |

---

## PART 6 — HOW TO RUN LOCALLY (3 commands)

```bash
# 1. Fill in secrets
cp .env.example .env
# Edit .env → set ANTHROPIC_API_KEY

# 2. Start everything
docker compose up --build

# 3. Seed the database (first time only)
docker compose exec core-api npm run prisma:seed
```

API is live at `http://localhost:3000/api/v1`
FastAPI docs at `http://localhost:8000/docs` (auto-generated, useful for testing AI endpoints)

---

*Last updated: June 2026 | ExamFar Backend v1.0*
