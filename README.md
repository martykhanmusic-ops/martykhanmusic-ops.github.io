# STACKFAST

STACKFAST is a production-ready Next.js dashboard for an AI full-stack app builder. Users describe an app in plain English, then watch a backend pipeline move from request intake through planning, code generation, testing, packaging, deployment, and monitoring.

## Tech stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-inspired reusable primitives
- Lucide icons
- Framer Motion
- PostgreSQL/Supabase-ready schema in `src/db/schema.sql`
- Docker-ready standalone build
- Vitest tests

## Core experience

- Dark futuristic SaaS dashboard with midnight navy surfaces, electric blue highlights, green deployment states, purple monitoring loops, glowing borders, and rounded cards.
- Sidebar routes for Dashboard, New Project, Projects, Templates, Deployments, Environments, Usage, Team, Settings, and Billing.
- Prompt composer for “Describe your app”.
- Animated workflow diagram covering User Input, Request Received, Analyze & Plan, Generate Code, Validate & Test, Package App, Provision Infrastructure, Deploy, App Live, and Observe & Improve.
- Mock API routes for project creation and pipeline simulation.
- Demo cards for logs, monitoring, user feedback, scaling, technology stack, and security/privacy.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev      # Start local development server
npm run build    # Build production app
npm run start    # Start production server after build
npm run lint     # Run Next.js ESLint checks
npm run test     # Run Vitest tests
```

## Mock API

- `GET /api/projects` returns seed/demo projects.
- `POST /api/projects` accepts `{ "prompt": "..." }` and returns a generated project plus pipeline steps.
- `GET /api/projects/:id/pipeline` returns a time-based simulated pipeline progress payload.

## Database schema

The PostgreSQL/Supabase schema includes:

- `projects`: id, name, description, prompt, status, current_step, created_at, updated_at.
- `pipeline_steps`: id, project_id, title, description, status, logs, created_at, updated_at.

Apply `src/db/schema.sql` in Supabase SQL editor or a PostgreSQL migration tool.

## Docker

```bash
docker build -t stackfast .
docker run -p 3000:3000 stackfast
```

## Production notes

The current app uses mock data and mock API routes. To connect a real backend, replace the route handlers in `src/app/api/**` with Supabase/PostgreSQL calls and persist pipeline events from your job runner or orchestration service.
