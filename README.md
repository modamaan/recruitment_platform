# AI-Powered College Placement Platform

An intelligent, centralized hub designed to modernize the campus recruitment lifecycle. This platform replaces manual, time-consuming processes with automated resume parsing, intelligent candidate-to-job matching, and real-time AI-driven screening interviews.

---

## 🏗️ Product Architecture

The platform operates on a modern **Serverless Edge Architecture**, utilizing Next.js as both the robust frontend client and the backend orchestration API layer.

### System Flow

1. **Client Layer**: Next.js App Router providing Server-Side Rendered (SSR) and Client-rendered interfaces for Students, Recruiters, and Admins.
2. **Authentication**: **Clerk** manages user sessions and role-based access control (RBAC).
3. **API & Orchestration Layer**: Next.js Server Actions and API Routes securely handle business logic.
4. **Database & ORM**: **NeonDB** (Serverless PostgreSQL) connected via **Drizzle ORM** for type-safe database queries.
5. **AI Services Integration**:
   - **Voice Agent**: Integrates with real-time AI voice services (like Murf Falcon or OpenAI Realtime) via WebRTC for conducting mock and screening interviews.
   - **LLM Processing**: Uses Claude 3.5 / GPT-4o for parsing uploaded resumes and generating structured post-interview scorecard reports.

---

## 🎨 Frontend UI/UX System Design

The frontend is meticulously designed to provide a premium, modern, and highly responsive user experience.

### 1. Design Language & Aesthetics

- **Framework**: Tailwind CSS v4 for rapid, utility-first styling.
- **Component Library**: **Shadcn UI** (configured with the sleek "Nova" preset) provides accessible, unstyled components that we have customized to fit our brand identity.
- **Typography**: Utilizing `next/font` (Geist/Inter) for crisp, modern typography that is easy to read on data-heavy dashboards.
- **Theming**: Integrated with `next-themes` to support flawless Light and Dark modes.

### 2. UX Principles

- **Clarity over Clutter**: Dashboards (like the Recruiter Candidate Table) prioritize data scannability. Match scores are represented visually with progress bars and badges.
- **Frictionless Interactions**: Features like drag-and-drop resume uploads and one-click "Start Interview" buttons reduce user friction.
- **Micro-interactions**: The AI voice interview room features animated visualizers (pulsing waves) that react to the voice agent speaking, providing crucial feedback to the user that the system is listening/processing.

### 3. Component Architecture

The UI is strictly separated into logical layers:

- `/components/ui/`: Low-level, reusable atoms (Buttons, Inputs, Cards, Tables, Badges).
- `/components/layout/`: Structural shells (e.g., `AppSidebar`, `DashboardLayout`) that wrap the application routes.
- `/app/dashboard/...`: The routed pages containing the specific feature composition.

### 4. Core User Flows (UI)

- **Student Portal**: Focuses on "My Profile" (resume upload/management), "Matched Jobs", and entering the "Mock Interview" WebRTC room.
- **Recruiter Portal**: Focuses on high-level overviews—creating job postings and managing a sortable table of AI-ranked candidates.

---

## 💻 Tech Stack Setup

- **Frontend Core**: Next.js 16 (App Router), React 19
- **Styling**: Tailwind CSS v4, Shadcn UI
- **Backend / API**: Node.js, Next.js API Routes
- **Database**: NeonDB (PostgreSQL)
- **ORM**: Drizzle ORM
- **Auth**: Clerk
- **AI Integrations**: Murf Falcon / Vapi (Voice), Claude / OpenAI (Text/Analysis)

---

## 🚀 Getting Started

### Prerequisites

Make sure you have Node.js (v18+) installed.

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Run the development server (using Turbopack for faster builds):

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. You can easily navigate to the mock dashboards via the landing page buttons.
