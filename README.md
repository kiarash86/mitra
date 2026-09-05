<p align="center">
  <a href="./README.md"><img src="https://img.shields.io/badge/lang-English-blue.svg" alt="English"></a>
  <a href="./README.fa.md"><img src="https://img.shields.io/badge/lang-فارسی-green.svg" alt="فارسی"></a>
</p>

# Mitra

A **project-centric** organizational management and communication system: an organization has projects, projects have members and tasks, and tasks are assigned to users.

Backend: Go (Gin) · sqlc · PostgreSQL — Frontend: React + TypeScript (Vite)

> **Single-organization model:** there is no self-serve sign-up or "create organization" flow. The one organization and its first owner account are created by a seed step (see [Local Setup](#local-setup)); from there the owner adds members through the API/UI. There is currently no `/auth/register` endpoint.

---

## Hierarchical Structure

```
Organization
  └── OrganizationMember (role: owner / admin / member / viewer)

Project
  ├── belongs to Organization
  ├── ProjectMember (project-level role)
  └── Task
        ├── assigned to a single User (not a Team — this system has no Team concept)
        ├── status: todo / in_progress / review / done
        ├── priority: low / medium / high / urgent
        └── Comment
```

> This project is intentionally designed without a "Team" level; RBAC is defined only at the `organization` and `project` levels.

---

## Tech Stack

| Layer       | Technology                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| Backend     | Go + [Gin](https://gin-gonic.com/)                                                                          |
| Data Access | [sqlc](https://sqlc.dev/) (no ORM) on top of [pgx/v5](https://github.com/jackc/pgx)                         |
| Migrations  | [golang-migrate](https://github.com/golang-migrate/migrate)                                                 |
| Auth        | JWT (access + refresh) via [golang-jwt/v5](https://github.com/golang-jwt/jwt), passwords hashed with bcrypt |
| Database    | PostgreSQL 16                                                                                               |
| Frontend    | React 19 + TypeScript + Vite, Zustand (state), React Router, i18n (Persian/English)                         |

**Current architectural decisions (cost control in Phase 1):**
Redis and NATS/JetStream have been removed from the stack for now. Details and the criteria for bringing them back are documented in [`MITRA.md`](./MITRA.md).

---

## Prerequisites

- Docker + Docker Compose — for the all-in-one setup, or just to run PostgreSQL locally
- Go 1.27+ — needed for the manual (non-Docker) backend setup, **and** for the one-time seed step even when running everything else via Docker (`cmd/seed` isn't built into the Docker image)
- Node.js 20+ — only needed for the manual (non-Docker) frontend setup
- [golang-migrate CLI](https://github.com/golang-migrate/migrate#installation) — only needed for the manual backend setup

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

This reads `ORG_NAME`, `ORG_SLUG`, `OWNER_EMAIL`, `OWNER_NAME`, and `OWNER_PASSWORD` from `.env` and creates the organization plus its owner. It's a no-op (prints a message and exits) if an organization already exists, so it's safe to re-run.

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

By default the frontend talks to `http://localhost:8080`. Set `VITE_API_URL` in `web/.env` to point elsewhere.

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

---

## Known Limitations (Phase 1)

- **No `/auth/refresh` endpoint yet** — the frontend's axios client already has retry logic wired up to call it on a 401, but the backend doesn't implement this route yet, so an expired access token currently just logs the user out and requires a fresh login.
- **No self-serve registration or organization creation** — by design for now; see the note in [Organizations](#organizations-requires-authorization-bearer).
- **Seeding isn't containerized** — `cmd/seed` has to be run with `go run` (locally or in CI), even in the Docker setup; there's no `docker-compose` service for it yet.
- Presence/Realtime/Push notifications are not yet implemented (Phase 2), even though the frontend already has `Chat` and `Notifications` pages scaffolded.
- No Redis/NATS — rationale and temporary workaround documented in `MITRA.md`.

The full phasing roadmap and architectural decisions are documented in [`MITRA.md`](./MITRA.md).