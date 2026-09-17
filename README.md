<div align="center">
  <h1 align="center">Formium</h1>
  <p align="center">
    Empower Creativity, Simplify Form Building Effectively
  </p>
</div>

<!-- Badges -->
<div align="center">

  <img src="https://img.shields.io/badge/license-MIT-yellow?style=for-the-badge" alt="License">
</div>

<!-- Tech Stack -->
<div align="center" style="margin-top: 1rem;">
  <p><strong>Built with the tools and technologies:</strong></p>
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React">
  <img src="https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/postgres-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
</div>

---

## Overview

Formium is a form builder that lets you create, publish, and collect responses for custom forms using a slash-command editor. Type `/` to add any block type — short answers, multiple choice, dates, ratings, file uploads, and more — then publish and share a link. Every form gets its own response table, analytics, and AI-powered insights.

---

## Repository layout

| Directory | Description |
|---|---|
| `formium/` | Single Next.js 16 app (App Router) — UI + API + background/realtime concerns |

The previous Express + Prisma backend and Vite frontend have been consolidated into `formium/`. All API routes live as Next.js Route Handlers under `formium/app/api/`.

---

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL (or Docker)
- npm

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/priyanshuwalia/Formium
   cd Formium
   ```

2. Set up the app:

   ```sh
   cd formium
   cp .env.example .env
   # fill in DATABASE_URL, JWT_SECRET, and the optional integrations you need
   npm install
   npx prisma migrate dev
   ```

3. Run the dev server:

   ```sh
   npm run dev
   ```

   Then open http://localhost:3000.

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Run production build |
| `npm run lint` | ESLint (0 warnings/errors enforced) |
| `npm test` | Vitest unit tests |

---

## Feature overview

- **Slash-command form builder** — type `/` to insert any block type
- **12 block types** — short/long answers, multiple choice, checkboxes, dropdown, number, email, phone, link, date, rating, file upload
- **Drag-and-drop editor** — reorder blocks with dnd-kit (drag the grip, then drop)
- **Logic jumps** — conditionally show blocks based on earlier answers
- **Publish & share** — each form gets a unique slug URL + embed widget (`<iframe>`)
- **Responses** — per-form response tables, detail views, and CSV export
- **Analytics** — response counts, 7-day trends, top-performing forms
- **AI Response Intelligence** — one-click Claude summary, themes, and notable responses
- **Auth** — email/password (bcrypt) + Google sign-in, httpOnly cookie JWT sessions with refresh tokens
- **Billing** — Stripe subscriptions (Free/Pro tiers) with plan limits
- **File uploads** — Cloudflare R2 presigned uploads (Pro plan)
- **Email** — Resend transactional email (new-response notifications)
- **Error tracking** — Sentry
- **Dark mode** — light/dark theme toggle
- **Templates** — quick-start contact, event registration, and feedback templates

---

## API

Route Handlers under `formium/app/api/`:

- `/api/auth/*` — register, login, google, logout, me
- `/api/forms` — create; `/api/forms/[slug]` — get/update/delete; `/api/forms/dashboard` — list
- `/api/form-blocks` and `/api/form-blocks/[id]` — CRUD for blocks
- `/api/response` — submit; `/api/response/[formId]`, `/api/response/detail/[id]` — read; `/api/response/export` — CSV
- `/api/analytics` — aggregate stats
- `/api/ai/analyze` — AI response intelligence
- `/api/billing/checkout` / `portal` / `webhook` / `status` — Stripe billing
- `/api/upload` — R2 presigned upload URL
- `/api/user` — profile update/delete

---

## Environment (see `.env.example`)

`DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `RESEND_API_KEY`, `R2_*` (endpoint/access key/secret/bucket), `SENTRY_*`, `STRIPE_*`, `ANTHROPIC_API_KEY`.

---

## Testing & CI

- Vitest unit tests in `formium/tests/` cover auth, form service, and validation logic.
- GitHub Actions workflow (`.github/workflows/ci.yml`) runs lint, typecheck, tests, and build.

---

## Contributing

Open an issue or pull request. See the MIT license below.

## License

MIT © 2025 Priyanshu Walia