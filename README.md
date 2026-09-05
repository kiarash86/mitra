<p align="center">
  <a href="./README.md"><img src="https://img.shields.io/badge/lang-English-blue.svg" alt="English"></a>
  <a href="./README.fa.md"><img src="https://img.shields.io/badge/lang-فارسی-green.svg" alt="persian"></a>
</p>

# Mitra

A **project-centric** organizational management and communication system: an organization has projects, projects have members and tasks, and tasks are assigned to users.

Backend: Go (Gin) · sqlc · PostgreSQL — Frontend: React + TypeScript (Vite)

> **Single-organization model:** there is no self-serve sign-up or "create organization" flow. The one organization and its first owner account are created by a seed step (see [Local Setup](#local-setup)); from there the owner adds members through the API/UI. There is currently no `/auth/register` endpoint.

This is a Phase 1 / MVP snapshot — see [Known Limitations](#known-limitations-phase-1) for what's intentionally not built yet, and [`MITRA.md`](./MITRA.md) for the full architecture proposal and roadmap (in Persian).

---

## Table of Contents

- [Mitra](#mitra)
  - [Table of Contents](#table-of-contents)
  - [Hierarchical Structure](#hierarchical-structure)
  - [Tech Stack](#tech-stack)
  - [Repository Layout](#repository-layout)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Local Setup](#local-setup)
    - [Option A — Docker (all services)](#option-a--docker-all-services)
    - [Option B — Manual (Backend)](#option-b--manual-backend)
    - [Manual (Frontend)](#manual-frontend)
  - [API (Currently Implemented)](#api-currently-implemented)
    - [Health](#health)
    - [Auth](#auth)
    - [Organizations *(requires Authorization: Bearer)*](#organizations-requires-authorization-bearer)
    - [Projects](#projects)
    - [Tasks](#tasks)
    - [Comments](#comments)
    - [Requested by the frontend but not yet implemented on the backend](#requested-by-the-frontend-but-not-yet-implemented-on-the-backend)
  - [Frontend Overview](#frontend-overview)
  - [Roles \& Permissions](#roles--permissions)
  - [Known Limitations (Phase 1)](#known-limitations-phase-1)
  - [Roadmap](#roadmap)
  - [License](#license)

---

## Hierarchical Structure

```
Organization
  └── OrganizationMember (role: owner / admin / member / viewer)

Project
  ├── belongs to Organization
  ├── ProjectMember (project-level role: owner / admin / member / viewer)
  └── Task
        ├── assigned to a single User (not a Team — this system has no Team concept)
        ├── status: todo / in_progress / review / done
        ├── priority: low / medium / high / urgent
        └── Comment
```

> This project is intentionally designed without a "Team" level; RBAC is defined only at the `organization` and `project` levels — a user can be an admin on one project and a plain member on another.

---

## Tech Stack

| Layer       | Technology                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| Backend     | Go 1.27 + [Gin](https://gin-gonic.com/)                                                                     |
| Data Access | [sqlc](https://sqlc.dev/) (no ORM) on top of [pgx/v5](https://github.com/jackc/pgx)                         |
| Migrations  | [golang-migrate](https://github.com/golang-migrate/migrate)                                                 |
| Auth        | JWT (access + refresh) via [golang-jwt/v5](https://github.com/golang-jwt/jwt), passwords hashed with bcrypt |
| Database    | PostgreSQL 16                                                                                                |
| Frontend    | React 19 + TypeScript + Vite 8, Tailwind CSS 4                                                              |
| Frontend state | Zustand (per-domain stores), React Router 7                                                              |
| i18n        | Custom context-based i18n, Persian (`fa`) and English (`en`), RTL-aware UI                                  |

**Current architectural decisions (cost control in Phase 1):**
Redis and NATS/JetStream have been removed from the stack for now. Details and the criteria for bringing them back are documented in [`MITRA.md`](./MITRA.md).

---

## Repository Layout

```
mitra/
├── cmd/
│   ├── api/            # HTTP server entrypoint (routes, wiring) — main.go
│   └── seed/           # One-time seed: creates the organization + owner account
├── internal/
│   ├── auth/           # Login, change-password, JWT issuing/parsing, password hashing
│   ├── organization/   # Organization + organization-member handlers
│   ├── project/        # Project CRUD + project-member handlers
│   ├── task/           # Task CRUD, status, assignment
│   ├── comment/        # Task comments
│   ├── rbac/           # Scope-aware role checks (organization/project owner|admin)
│   ├── middleware/     # Auth middleware (Bearer token → user context)
│   ├── config/         # Env loading (caarlos0/env + godotenv)
│   ├── convert/        # Shared helpers (e.g. flexible date parsing)
│   └── db/
│       ├── migrations/ # golang-migrate SQL migrations (001–007)
│       ├── queries/    # Hand-written SQL used by sqlc
│       └── sqlc/       # Generated, type-safe Go from sqlc.yaml
├── web/                # React + TypeScript frontend (see Frontend Overview)
├── docker-compose.yaml # postgres + migrate + api + web
├── Dockerfile          # Builds cmd/api only (cmd/seed is not containerized)
├── sqlc.yaml
├── MITRA.md            # Full architecture proposal & phased roadmap (Persian)
├── README.md / README.fa.md
└── .env.example
```

---

## Prerequisites

- Docker + Docker Compose — for the all-in-one setup, or just to run PostgreSQL locally
- Go 1.27+ — needed for the manual (non-Docker) backend setup, **and** for the one-time seed step even when running everything else via Docker (`cmd/seed` isn't built into the Docker image)
- Node.js 20+ — only needed for the manual (non-Docker) frontend setup
- [golang-migrate CLI](https://github.com/golang-migrate/migrate#installation) — only needed for the manual backend setup

---

## Environment Variables

All variables live in `.env` (copy from `.env.example`). The `api` and `seed` binaries both read this file via `internal/config`.

| Variable                | Used by      | Description                                                                 |
| ------------------------ | ------------ | ----------------------------------------------------------------------------- |
| `APP_ENV`                | api          | `development`, `production`, or `test` — controls Gin's mode                  |
| `APP_PORT`               | api          | Port the API listens on (default `8080`)                                      |
| `DATABASE_URL`           | api, seed    | Full Postgres connection string; takes priority when set                      |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` / `DB_SSLMODE` | api, docker-compose | Used to build the connection string / to configure the `postgres` container |
| `JWT_SECRET`             | api          | **Required** — the API refuses to start if this is empty                      |
| `JWT_ACCESS_TOKEN_TTL`   | api          | Access token lifetime (e.g. `15m`)                                            |
| `JWT_REFRESH_TOKEN_TTL`  | api          | Refresh token lifetime (e.g. `720h`) — issued today, but there's no `/auth/refresh` route yet to redeem it |
| `ORG_NAME`               | seed         | Display name of the single organization created on first run                  |
| `ORG_SLUG`               | seed, web build | Organization slug; also passed as `VITE_ORG_SLUG` to the frontend build     |
| `OWNER_EMAIL`            | seed         | Login email for the seeded owner account                                      |
| `OWNER_NAME`             | seed         | Full name for the seeded owner account                                        |
| `OWNER_PASSWORD`         | seed         | Initial password for the seeded owner account — change it after first login   |

> `seed` fails fast if `OWNER_EMAIL`, `OWNER_NAME`, or `OWNER_PASSWORD` are empty. It's a no-op (prints a message and exits 0) if an organization already exists, so it's safe to re-run.

---

## Local Setup

### Option A — Docker (all services)

```bash
cp .env.example .env
# JWT_SECRET is required — the api will fail to start if it's empty.
# The placeholder value in .env.example works for localhost only;
# replace it with a real random secret for anything beyond that.
# ORG_NAME / ORG_SLUG / OWNER_EMAIL / OWNER_NAME / OWNER_PASSWORD are used by the seed step below.

docker compose up --build
```

This starts everything: `postgres` → migrations run automatically via the `migrate` service → `api` on `http://localhost:8080` → `web` on `http://localhost:3000`.

> `web`'s `VITE_API_URL` build arg is empty by default in `docker-compose.yaml`, so the frontend falls back to `http://localhost:8080` for the API at build time. If you're deploying `api` and `web` on different hosts, set `VITE_API_URL` accordingly before building.

**Seed the first organization and owner account** (one-time, required before you can log in — there's no `docker-compose` service for this yet, so it's run locally against the Dockerized Postgres):

```bash
export DATABASE_URL="postgres://mitra:mitra@localhost:5432/mitra?sslmode=disable"
go run ./cmd/seed
```

This reads `ORG_NAME`, `ORG_SLUG`, `OWNER_EMAIL`, `OWNER_NAME`, and `OWNER_PASSWORD` from `.env` and creates the organization plus its owner.

### Option B — Manual (Backend)

```bash
# 1. Start the database only
docker compose up -d postgres

# 2. Configure env
cp .env.example .env
# Make sure to replace JWT_SECRET with a secure, random value

# 3. Run migrations
export DATABASE_URL="postgres://mitra:mitra@localhost:5432/mitra?sslmode=disable"
migrate -database "$DATABASE_URL" -path internal/db/migrations up

# 4. Seed the first organization and owner account (one-time, required before you can log in)
go run ./cmd/seed

# 5. Run the server
go run ./cmd/api
# health check: curl http://localhost:8080/health
```

### Manual (Frontend)

```bash
cd web
npm install
npm run dev
```

By default the frontend talks to `http://localhost:8080`. Set `VITE_API_URL` in `web/.env` to point elsewhere, and `VITE_ORG_SLUG` to match `ORG_SLUG` from the backend `.env`.

---

## API (Currently Implemented)

Base path: `/api/v1` (except `/health`, which is unversioned)

### Health
| Method | Path      | Description            |
| ------ | --------- | ----------------------- |
| GET    | `/health` | Liveness/health check   |

### Auth
| Method | Path                     | Description                                            |
| ------ | ------------------------ | -------------------------------------------------------- |
| POST   | `/auth/login`            | Login                                                    |
| POST   | `/auth/change-password`  | Change own password *(requires Authorization: Bearer)*  |

> There is no `/auth/register`. Accounts are created either by the seed step (the first owner) or by an org/project admin adding a member — see [Organizations](#organizations-requires-authorization-bearer). Login responses include `must_change_password`; the frontend routes users with that flag set to a forced password-change screen before letting them in.

### Organizations *(requires Authorization: Bearer)*
| Method | Path                                   | Description                    |
| ------ | --------------------------------------- | ------------------------------- |
| GET    | `/organizations/by-slug/:slug`         | Get organization by slug       |
| GET    | `/organizations/:id/members`           | List members                    |
| POST   | `/organizations/:id/members`           | Add member                      |
| DELETE | `/organizations/:id/members/:user_id`  | Remove member                   |
| POST   | `/organizations/:id/projects`          | Create project in organization |
| GET    | `/organizations/:id/projects`          | List organization's projects    |

> No `POST /organizations` — self-serve organization creation was removed; the single organization is created by the seed step instead.

### Projects
| Method | Path                              | Description             |
| ------ | ---------------------------------- | ------------------------ |
| GET    | `/projects/:id`                   | Project details          |
| PUT    | `/projects/:id`                   | Edit project              |
| DELETE | `/projects/:id`                   | Delete (soft) project     |
| GET    | `/projects/:id/members`           | List project members     |
| POST   | `/projects/:id/members`           | Add member                |
| DELETE | `/projects/:id/members/:user_id`  | Remove member             |
| POST   | `/projects/:id/tasks`             | Create task in project    |
| GET    | `/projects/:id/tasks`             | List project's tasks      |

### Tasks
| Method | Path                      | Description           |
| ------ | -------------------------- | ---------------------- |
| GET    | `/tasks/assigned-to-me`   | Tasks assigned to me   |
| GET    | `/tasks/:id`              | Task details            |
| PUT    | `/tasks/:id`              | Edit task                |
| PATCH  | `/tasks/:id/status`       | Change status            |
| POST   | `/tasks/:id/assign/user`  | Assign to a user         |
| POST   | `/tasks/:id/unassign`     | Unassign                  |
| DELETE | `/tasks/:id`              | Delete (soft)            |
| GET    | `/tasks/:id/comments`     | List task comments       |
| POST   | `/tasks/:id/comments`     | Add comment               |

### Comments
| Method | Path            | Description    |
| ------ | --------------- | -------------- |
| PUT    | `/comments/:id` | Edit comment   |
| DELETE | `/comments/:id` | Delete comment |

### Requested by the frontend but not yet implemented on the backend
The web client already has API/store/hook code for these — they currently 404 against this backend:

| Method | Path                          | Used by (frontend)                          |
| ------ | ------------------------------ | ---------------------------------------------- |
| GET    | `/v1/users/me`                | `api/users.ts` (profile page)                  |
| PATCH  | `/v1/users/me`                | `api/users.ts` (profile page)                  |
| GET    | `/v1/notifications`           | `api/notifications.ts`, notifications store    |
| PATCH  | `/v1/notifications/:id/read`  | `api/notifications.ts`                         |
| PATCH  | `/v1/notifications/read-all`  | `api/notifications.ts`                         |
| WS     | (a websocket endpoint)        | `hooks/use-websocket.ts`, chat page            |

None of these have a corresponding Go handler yet — see [Known Limitations](#known-limitations-phase-1).

---

## Frontend Overview

React 19 + TypeScript app in `web/`, built with Vite and styled with Tailwind CSS 4.

- **Routing** (`src/router.tsx`): auth pages (`login`, forced password change), dashboard, project list/detail with a task board, task detail, organization members/settings, profile, chat, and notifications. `components/guards/RouteGuards.tsx` gates routes on auth state; `components/organizations/OrgGate.tsx` gates on organization membership.
- **State** (`src/stores/`): one Zustand store per domain — `auth`, `organization`, `project`, `task`, `notification`, `toast`, `ui`.
- **API layer** (`src/api/`): a thin axios client (`client.ts`) plus one module per resource (`auth`, `organizations`, `projects`, `tasks`, `comments`, `notifications`, `users`). The `notifications` and `users` modules call endpoints the backend doesn't expose yet (see the table above).
- **Realtime**: `hooks/use-websocket.ts` is a generic reconnecting-WebSocket hook, used by the chat page — there's no WebSocket server on the backend yet (Phase 2, see [`MITRA.md`](./MITRA.md)).
- **i18n**: `src/i18n/` provides Persian (`fa.ts`) and English (`en.ts`) dictionaries behind a React context, with RTL-aware components (`DirectionalIcon`, `LanguageSwitcher`) and a Vazirmatn variable font for Persian.
- **UI kit**: a small local component library in `src/components/ui/` (Button, Card, Modal, Toaster, DonutChart, StatCard, etc.) rather than a third-party design system.
- **Permissions**: `src/lib/permissions.ts` mirrors the backend's org/project owner-or-admin checks so the UI can hide actions the API would reject.

---

## Roles & Permissions

Roles are free-form `VARCHAR` values (no DB-level enum), but the app treats these as the valid set at both scopes:

| Role     | Organization scope                          | Project scope                          |
| -------- | --------------------------------------------- | ----------------------------------------- |
| `owner`  | Full control; set once by the seed step       | Full control over that project            |
| `admin`  | Manage members/projects, same as owner for most checks | Manage members/tasks, same as project owner for most checks |
| `member` | Default role for anyone added to the organization | Default role for anyone added to a project |
| `viewer` | Read-only (per the hierarchy diagram)         | Read-only (per the hierarchy diagram)     |

`internal/rbac/policy.go` implements the checks actually enforced today: `IsOrganizationMember`, `IsOrganizationOwnerOrAdmin`, `IsProjectMember`, `IsProjectOwnerOrAdmin` — i.e. most write actions currently just require "member" or "owner/admin", not a fully granular per-permission model yet (that's Phase 3 in `MITRA.md`).

---

## Known Limitations (Phase 1)

- **No `/auth/refresh` endpoint yet** — the frontend's axios client already has retry logic wired up to call it on a 401, but the backend doesn't implement this route yet, so an expired access token currently just logs the user out and requires a fresh login.
- **No self-serve registration or organization creation** — by design for now; see the note under [Organizations](#organizations-requires-authorization-bearer).
- **Seeding isn't containerized** — `cmd/seed` has to be run with `go run` (locally or in CI), even in the Docker setup; there's no `docker-compose` service for it yet.
- **Frontend/backend gap** — the web app already has UI, stores, and API calls for a user profile endpoint, notifications, and a WebSocket connection (chat), none of which exist on the backend yet. See the table in [API](#api-currently-implemented).
- **Presence/Realtime/Push notifications** are not yet implemented (Phase 2).
- **No Redis/NATS** — removed for cost control in Phase 1; rationale and temporary in-process workaround documented in `MITRA.md`.
- **No automated tests** in this snapshot (`internal/`, `web/`) — sqlc queries and handlers are not yet covered by integration tests.

---

## Roadmap

Summarized from [`MITRA.md`](./MITRA.md) (full detail and rationale there, in Persian):

1. **Phase 1 — Core MVP** *(current)*: auth, organization/project/task CRUD, task comments, basic dashboard, scope-aware RBAC. ✅ mostly done, gaps listed above.
2. **Phase 2 — Communication & Realtime**: in-app chat over WebSocket (in-process hub, no NATS yet), push notifications (direct FCM calls, no queue yet), live task-status updates.
3. **Phase 3 — Advanced access & reporting**: full RBAC with project-level overrides, activity-log-based reporting, advanced filtering/search.
4. **Phase 4 — Desktop & optimization**: Tauri desktop packaging around the same React codebase, full offline mode for the (planned) Flutter mobile app, revisit bringing Redis/NATS back if horizontal scaling is actually needed.

---

## License

MIT — see [`LICENSE`](./LICENSE).
