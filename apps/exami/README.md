# Exami — Web Frontend

The Next.js 16 frontend for **Exami**, the secure / fair / intelligent examinations
platform (FAR AWAY 2026 — Problem 2). It consumes the NestJS `core-api` and the
FastAPI `ai-svc` (indirectly, through the core-api).

Built per [`FRONTEND_GUIDE.md`](../../Exami-be/FRONTEND_GUIDE.md): **30 pages across
6 dashboards**, every page wired to real API endpoints.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TypeScript** (strict)
- **Tailwind CSS v4** (CSS-first theme in `app/globals.css`)
- **TanStack Query** — server state, caching, mutations
- **Zustand** — auth + toast stores
- **axios** — API client with JWT refresh interceptor
- **socket.io-client** — real-time proctoring
- **Recharts** — score distributions
- **lucide-react** — icons

## Getting started

```bash
npm install
npm run dev      # http://localhost:3001
```

The backend (`Exami-be`) must be running on `http://localhost:3000`. Configure URLs in
`.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

> The frontend runs on **port 3001** so it doesn't collide with the core-api on 3000.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server on :3001 |
| `npm run build` | Production build |
| `npm start` | Serve the production build on :3001 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Architecture

Four route groups, each its own "app" with its own guard:

```
app/
├── (auth)/      Login, OTP                         [public]
├── (admin)/     Admin · Examiner · Invigilator     [staff — role-guarded sidebar]
├── (exam)/      Student portal + locked exam runner [candidate]
└── (public)/    Public registration + scoreboard    [no auth]
```

- **Auth** is JWT-in-memory + refresh token in `localStorage`. `lib/api/client.ts`
  transparently refreshes on 401 and unwraps the `{ success, data }` envelope.
- **Route guards** are client-side (`lib/hooks/use-guard.ts`) — the backend remains the
  real authority; the UI just avoids dead-ends.
- **The exam runner** (`app/(exam)/exam/[examId]`) is the crown jewel: server-authoritative
  timer, idempotent answer submission (per-question nonce), offline-cached answers,
  heartbeat with device-takeover detection, and invisible WebSocket proctoring with a
  REST batch fallback.

## Key directories

```
lib/
├── api/        One module per backend domain (auth, exams, questions, …)
├── hooks/      React Query hooks + use-countdown, use-guard, proctor feeds
├── store/      Zustand: auth, toast
├── ws/         Socket.IO factory
├── types.ts    Domain types mirroring the API
└── utils.ts    cn(), formatters, nonce + device token, JWT decode
components/
├── ui/         Primitives (button, card, input, table, modal, tabs, badge, toaster)
├── shared/     Sidebar, stat card, exam card, student topbar
├── exam/       ExamTimer, QuestionRenderer
├── examiner/   Roster, grading, results panels
├── proctor/    RiskBadge
└── charts/     ScoreDistribution
```

## Demo flow

1. **Staff:** `/login` → seeded `admin` / `examiner` / `invigilator`.
2. **Examiner:** create an exam → add questions (manual / CSV / AI) → publish.
3. **Student:** `/otp` → register → system check → take the exam.
4. **Invigilator:** `/monitor/:examId` watches risk in real time.
5. **Examiner:** grade subjective answers → publish results.
6. **Student:** view result → raise a dispute → examiner resolves → scoreboard re-ranks.
