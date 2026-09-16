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
  <img src="https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB" alt="Express.js">
  <img src="https://img.shields.io/badge/postgres-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
</div>

---

## Overview

Formium is a form builder that lets you create, publish, and collect responses for custom forms using a slash-command editor. Type `/` to add any block type — short answers, multiple choice, dates, ratings, file uploads, and more — then publish and share a link. Every form gets its own response table and analytics.

---

## Repository layout

| Directory | Description |
|---|---|
| `formium/` | Next.js 16 app (App Router) — the consolidated product frontend + API |
| `backend/` | Express 5 + Prisma API (being migrated into `formium/app/api/`) |
| `frontend/` | Legacy Vite + React 19 SPA (being consolidated into `formium/`) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (or Docker)
- npm

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/priyanshuwalia/Formium
   cd Formium
   ```

2. Set up the database:

   ```sh
   cd backend
   cp example.env .env
   # fill in DATABASE_URL, JWT_SECRET, PORT
   npx prisma migrate dev
   ```

3. Run the API:

   ```sh
   npm install
   npm run dev
   ```

4. Run the frontend:

   ```sh
   cd ../frontend
   cp .env.example .env  # or create .env with VITE_GOOGLE_CLIENT_ID and VITE_API_BASE_URL
   npm install
   npm run dev
   ```

---

## Feature overview

- **Slash-command form builder** — type `/` to insert any block type
- **12 block types** — short/long answers, multiple choice, checkboxes, dropdown, number, email, phone, link, date, rating, file upload
- **Publish & share** — each form gets a unique slug URL
- **Responses** — per-form response tables with detail views
- **Analytics** — response counts, 7-day trends, top-performing forms
- **Auth** — email/password (bcrypt) + Google sign-in (GSI), JWT sessions
- **Dark mode** — light/dark theme toggle
- **Templates** — quick-start contact, event registration, and feedback templates

---

## API

The API is documented under `backend/src/modules/`. Route groups:

- `/api/auth` — register, login, google
- `/api/forms` — create, list, get by slug, update, delete
- `/api/form-blocks` — CRUD for blocks
- `/api/response` — submit and read responses
- `/api/analytics` — aggregate stats
- `/api/user` — profile update/delete

---

## Contributing

Open an issue or pull request. See the MIT license below.

## License

MIT © 2025 Priyanshu Walia