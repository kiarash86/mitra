# Mitra

A **project-centric** organizational management and communication system: organizations create projects, projects have members and tasks, and tasks are assigned to users.

Backend: Go (Gin) · sqlc · PostgreSQL — Frontend: React + TypeScript (Vite)

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

- Go 1.27+
- Node.js 20+
- Docker (to run PostgreSQL locally) — or a separately installed Postgres instance
- [golang-migrate CLI](https://github.com/golang-migrate/migrate#installation)

---

## Local Setup (Backend)

```bash
# 1. Start the database
docker compose up -d postgres

# 2. Configure env
cp .env.example .env
# Make sure to replace JWT_SECRET with a secure, random value

# 3. Run migrations
export DATABASE_URL="postgres://mitra:mitra@localhost:5432/mitra?sslmode=disable"
migrate -database "$DATABASE_URL" -path internal/db/migrations up

# 4. Run the server
go run ./cmd/api
# health check: curl http://localhost:8080/health
```

> The `migrate`, `api`, and `web` services are also defined in `docker-compose.yaml`, but running them fully via `docker compose up` requires `Dockerfile`s for `api` and `web`, which haven't been added yet. Until then, the approach above (running directly with `go run`) is the recommended development workflow.

---

## Local Setup (Frontend)

```bash
cd web
npm install
npm run dev
```

---

## API (Currently Implemented)

Base path: `/api/v1`

### Auth
| Method | Path             | Description |
| ------ | ---------------- | ----------- |
| POST   | `/auth/register` | Register    |
| POST   | `/auth/login`    | Login       |

### Organizations *(requires Authorization: Bearer)*
| Method | Path                                  | Description                    |
| ------ | ------------------------------------- | ------------------------------ |
| POST   | `/organizations`                      | Create organization            |
| GET    | `/organizations/by-slug/:slug`        | Get organization by slug       |
| GET    | `/organizations/:id/members`          | List members                   |
| DELETE | `/organizations/:id/members/:user_id` | Remove member                  |
| POST   | `/organizations/:id/projects`         | Create project in organization |
| GET    | `/organizations/:id/projects`         | List organization's projects   |

### Projects
| Method | Path                             | Description            |
| ------ | -------------------------------- | ---------------------- |
| GET    | `/projects/:id`                  | Project details        |
| PUT    | `/projects/:id`                  | Edit project           |
| DELETE | `/projects/:id`                  | Delete (soft) project  |
| GET    | `/projects/:id/members`          | List project members   |
| POST   | `/projects/:id/members`          | Add member             |
| DELETE | `/projects/:id/members/:user_id` | Remove member          |
| POST   | `/projects/:id/tasks`            | Create task in project |
| GET    | `/projects/:id/tasks`            | List project's tasks   |

### Tasks
| Method | Path                     | Description          |
| ------ | ------------------------ | -------------------- |
| GET    | `/tasks/assigned-to-me`  | Tasks assigned to me |
| GET    | `/tasks/:id`             | Task details         |
| PUT    | `/tasks/:id`             | Edit task            |
| PATCH  | `/tasks/:id/status`      | Change status        |
| POST   | `/tasks/:id/assign/user` | Assign to a user     |
| POST   | `/tasks/:id/unassign`    | Unassign             |
| DELETE | `/tasks/:id`             | Delete (soft)        |
| GET    | `/tasks/:id/comments`    | List task comments   |
| POST   | `/tasks/:id/comments`    | Add comment          |

### Comments
| Method | Path            | Description    |
| ------ | --------------- | -------------- |
| PUT    | `/comments/:id` | Edit comment   |
| DELETE | `/comments/:id` | Delete comment |

---

## Known Limitations (Phase 1)

- No `/auth/refresh` — an expired access token currently requires logging in again.
- Presence/Realtime/Push notifications are not yet implemented (Phase 2).
- No Redis/NATS — rationale and temporary workaround documented in `MITRA.md`.
- No `Dockerfile` yet for the `api` and `web` services; local development runs via `go run` / `npm run dev`.

The full phasing roadmap and architectural decisions are documented in [`MITRA.md`](./MITRA.md).