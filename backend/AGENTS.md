# Backend — AI Recruitment Platform

## Overview
Node.js + Express backend with a LiveKit AI Agent Worker. Serves the REST API for the Next.js frontend and runs the AI Recruiter voice agent.

## Running Locally

**Start both the API server and AI agent worker together:**
```bash
npm start
```
This uses `concurrently` to run:
- `[API]` — Express server on port **8000** (`nodemon src/index.ts`)
- `[AGENT]` — LiveKit AI agent worker (`tsx src/agent.ts dev`)

**Run them separately:**
```bash
npm run dev    # API only
npm run agent  # Agent worker only
```

## Environment Variables (`.env`)
```env
DATABASE_URL=           # Neon Postgres connection string
NEON_AUTH_JWKS_URL=     # Neon Auth JWKS endpoint for JWT verification
NEON_AUTH_BASE_URL=     # Neon Auth base URL (used as JWT issuer)
LIVEKIT_URL=            # wss://your-project.livekit.cloud
LIVEKIT_API_KEY=        # LiveKit API key
LIVEKIT_API_SECRET=     # LiveKit API secret
OPENAI_API_KEY=         # OpenAI API key (used by the AI agent)
```

## Architecture

```
src/
├── index.ts       # Express HTTP server — all REST API routes
├── agent.ts       # LiveKit AI agent worker — voice interview brain
├── routes/
│   └── resume.ts  # Resume parsing endpoints
└── db/
    ├── index.ts   # Drizzle ORM client (Neon Postgres)
    └── schema.ts  # Database table definitions
```

## API Endpoints

All protected routes require a `Bearer <neon_auth_jwt>` header.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | Health check |
| GET | `/api/me` | ✅ | Get current user profile |
| POST | `/api/users` | ✅ | Create/upsert user profile after registration |
| POST | `/api/jobs` | ✅ | Create a new job posting (recruiter) |
| GET | `/api/jobs` | ✅ | Get all jobs posted by the current recruiter |
| GET | `/api/jobs/all` | ✅ | Get all available jobs (student view) |
| POST | `/api/interview/token` | ✅ | Generate LiveKit room token + dispatch AI agent |
| POST | `/api/resume/parse` | ❌ | Upload a PDF resume to extract structured JSON data via OpenAI |

## Resume Parsing Pipeline
The backend provides an AI-powered resume parser designed for the student profile:
1. `multer` stores the uploaded file in memory.
2. `pdf-parse` extracts raw text from the document.
3. The raw text is streamed to OpenAI GPT-4o with a strict schema to extract name, email, skills, education, and generate a professional summary.

## Database Schema

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| neon_user_id | text unique | From Neon Auth JWT `sub` |
| name | text | |
| email | text unique | |
| role | text | `'student'` or `'recruiter'` |
| created_at | timestamp | |

### `jobs`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| recruiter_id | text | `neon_user_id` of the recruiter |
| title | text | |
| company_name | text | |
| location | text | |
| employment_type | text | e.g. `'Full-time'`, `'Remote'` |
| salary_range | text | Optional |
| description | text | |
| requirements | text | |
| created_at | timestamp | |

### `interviews`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| job_id | int FK → jobs.id | |
| student_id | text | `neon_user_id` of the student |
| transcript | jsonb | Full conversation transcript |
| feedback | text | AI-generated feedback |
| match_score | int | 0–100 match score |
| status | text | `'pending'` or `'completed'` |
| created_at | timestamp | |

## Database Commands
```bash
npm run db:generate   # Generate Drizzle migration files
npm run db:push       # Push schema changes to Neon Postgres
```

## AI Agent (`src/agent.ts`)

The agent worker connects to LiveKit Cloud and waits for job dispatches. When a student opens an interview room:

1. `POST /api/interview/token` generates a JWT and calls `AgentDispatchClient.createDispatch(roomName, 'recruiter-agent')`
2. The agent worker receives the job, spawns a child process
3. The child process connects to the room using `voice.AgentSession` + `openai.realtime.RealtimeModel`
4. The AI speaks directly to the student via WebRTC audio

The agent uses **OpenAI Realtime (GPT-4o)** — no separate STT/TTS needed since the model handles voice natively.

> **Note:** The agent tsconfig is at `tsconfig.agent.json` (ESM mode) — separate from the main `tsconfig.json` (CommonJS) used by the Express server. This is required because `import.meta.url` is an ES module feature.
