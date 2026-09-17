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
  <img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white" alt="Express">
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
| `frontend/` | Vite + React + TypeScript single-page app (the UI) |
| `backend/` | Express 5 + Prisma API server |

The app is split into a static frontend and a REST API. All API routes are mounted under `/api` on the backend.

---

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL (or Docker)
- npm

### Backend

```sh
cd backend
cp example.env .env
# fill in DATABASE_URL, JWT_SECRET, and the optional integrations you need
npm install
npx prisma migrate deploy   # or `npx prisma migrate dev` for local development
npm run dev
```

The API runs at http://localhost:4000.

### Frontend

```sh
cd frontend
# create .env with:
#   VITE_API_BASE_URL=http://localhost:4000/api
npm install
npm run dev
```

Then open http://localhost:5173.

### Commands

| Directory | Command | Description |
|---|---|---|
| `frontend/` | `npm run dev` | Vite dev server |
| `frontend/` | `npm run build` | Type-check + production build |
| `frontend/` | `npm run lint` | ESLint |
| `backend/` | `npm run dev` | Express dev server (tsx watch) |
| `backend/` | `npm run build` | Compile TypeScript to `dist/` |
| `backend/` | `npm start` | Run the compiled server |

---

## Feature overview

- **Slash-command form builder** — type `/` to insert any block type
- **12+ block types** — short/long answers, multiple choice, checkboxes, dropdown, number, email, phone, link, date, rating, file upload, divider, heading
- **Drag-and-drop editor** — reorder blocks with dnd-kit
- **Logic jumps** — conditionally show blocks based on earlier answers
- **Publish & share** — each form gets a unique slug URL + embed widget (`<iframe>`)
- **Responses** — per-form response tables, detail views, and CSV export
- **Analytics** — response counts, 7-day trends, top-performing forms
- **AI Response Intelligence** — one-click Claude summary, themes, and notable responses
- **Auth** — email/password (bcrypt) + Google sign-in, JWT access tokens with refresh
- **Billing** — Stripe subscriptions (Free/Pro tiers) with plan limits
- **File uploads** — Cloudflare R2 presigned uploads (Pro plan)
- **Email** — Resend transactional email (password reset, new-response notifications)
- **Error tracking** — Sentry
- **Dark mode** — light/dark theme toggle
- **Templates** — quick-start contact, event registration, and feedback templates

---

## API

Routes mounted under `/api`:

- `/api/auth/*` — register, login, google, refresh, logout, forgot/reset password
- `/api/forms` — create; `/api/forms/[slug]` — get; `/api/forms/dashboard` — list; `/api/forms/:id` — update/delete
- `/api/form-blocks` and `/api/form-blocks/:id` — CRUD for blocks
- `/api/response` — submit; `/api/response/:formId`, `/api/response/detail/:id` — read; `/api/response/export` — CSV
- `/api/analytics` — aggregate stats
- `/api/ai/analyze` — AI response intelligence
- `/api/billing/status` / `checkout` / `portal` / `webhook` — Stripe billing
- `/api/upload` — R2 presigned upload URL
- `/api/user` — profile update/delete

---

## Environment

### Backend (`backend/example.env`)

`DATABASE_URL`, `JWT_SECRET`, `APP_URL`, `CORS_ORIGINS`, `STRIPE_*`, `R2_*`, `RESEND_API_KEY`, `EMAIL_FROM`, `ANTHROPIC_API_KEY`, `SENTRY_DSN`.

### Frontend

`VITE_API_BASE_URL` — the backend base URL including `/api`.

---

## Contributing

Open an issue or pull request. See the MIT license below.

## License

MIT © 2025 Priyanshu Walia
