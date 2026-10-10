<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Frontend — AI Recruitment Platform

## Overview
This is the Next.js 15 (App Router) frontend for the AI Recruitment Platform. It provides a notebook-style "quirky/sketchy" interface for Students and Recruiters to interact with the backend API and the LiveKit AI Voice Agent.

## Tech Stack
- **Framework:** Next.js 15 (React 19)
- **Styling:** Tailwind CSS + custom CSS (`app/globals.css`) for the notebook theme
- **Components:** shadcn/ui + Lucide Icons
- **WebRTC:** LiveKit Components (`@livekit/components-react`) for voice AI
- **Forms:** React state (Controlled Components)

## Design Aesthetics (Notebook Theme)
The UI uses a custom "hand-drawn notebook" aesthetic. When creating new components, follow these guidelines:
- **Borders:** `border-2 border-black`
- **Shadows:** Hard box shadows like `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
- **Typography:** `font-kalam` (Kalam Google Font) for headings and bold accents.
- **Backgrounds:** The global background is a graph-paper grid pattern defined in `globals.css`.
- **Colors:** Use accent colors like `#fcec6a` (yellow), `#e15b58` (red), `#7cb4cf` (blue). Do not use the yellow accent color for sidebar highlights.

## Core Features & Routes

### 1. Authentication & Role Guarding
- **Login/Register:** `/login` and `/register` pages communicate with the Neon Auth backend to fetch JWT tokens.
- **Role Guard:** `components/layout/role-guard.tsx` prevents Students from accessing Recruiter pages (and vice versa) without unmounting the DOM tree (which causes Next.js 15 hydration/segment drop errors). It uses CSS `display: none` to hide unauthorized content while keeping the tree intact.
- **Tokens:** Stored in `localStorage` under `authToken`.

### 2. Student Portal (`/dashboard/student`)
- **Profile (`/dashboard/student/profile`):** Features an **AI Resume Parser**. Users can upload a PDF (`.pdf`), which is sent to the backend `POST /api/resume/parse` endpoint. The frontend receives structured JSON and dynamically auto-fills the profile form, displaying specific backend errors if it fails.
- **Jobs (`/dashboard/student/jobs`):** Displays available job postings.
- **Interviews (`/dashboard/student/interview/[id]`):** Hosts the LiveKit voice room (`<LiveKitRoom>`) for the AI mock interview using the `@livekit/components-react` library. Uses `VoiceAssistantControlBar` for mic/audio controls.

### 3. Recruiter Portal (`/dashboard/recruiter`)
- **Jobs (`/dashboard/recruiter/jobs`):** Interface to post new jobs and view created jobs.

## Common Next.js 15 Quirks
- **Hydration Mismatches:** You may see console errors about tree hydration mismatches. These are generally benign in this dev environment and often caused by browser extensions or `fdprocessedid` injection.
- **Instant Navigation Validation:** If `RoleGuard` unmounts children, it causes a "Dropped segment" error. Always use `<Suspense>` boundaries and CSS toggling to avoid segment drops in layouts.

## Environment Variables
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```
*Note: Always use `process.env.NEXT_PUBLIC_BACKEND_URL` instead of hardcoding `http://localhost:8000` when calling the backend.*
