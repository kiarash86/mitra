# Mitra

سامانه‌ی مدیریت و ارتباطات سازمانی — **پروژه‌محور**: سازمان‌ها پروژه می‌سازند، پروژه‌ها عضو و تسک دارند، تسک‌ها به کاربر تخصیص داده می‌شوند.

Backend: Go (Gin) · sqlc · PostgreSQL — Frontend: React + TypeScript (Vite)

---

## ساختار سلسله‌مراتبی

```
Organization
  └── OrganizationMember (نقش: owner / admin / member / viewer)

Project
  ├── belongs to Organization
  ├── ProjectMember (نقش در سطح پروژه)
  └── Task
        ├── assigned to یک User (نه Team — این سیستم فاقد مفهوم Team است)
        ├── status: todo / in_progress / review / done
        ├── priority: low / medium / high / urgent
        └── Comment
```

> این پروژه عمداً بدون سطح «Team» طراحی شده؛ RBAC فقط در دو سطح `organization` و `project` تعریف می‌شود.

---

## پشته‌ی فنی

| بخش | تکنولوژی |
|---|---|
| Backend | Go + [Gin](https://gin-gonic.com/) |
| Data Access | [sqlc](https://sqlc.dev/) (بدون ORM) روی [pgx/v5](https://github.com/jackc/pgx) |
| Migration | [golang-migrate](https://github.com/golang-migrate/migrate) |
| Auth | JWT (access + refresh) با [golang-jwt/v5](https://github.com/golang-jwt/jwt)، پسورد با bcrypt |
| Database | PostgreSQL 16 |
| Frontend | React 19 + TypeScript + Vite، Zustand (state)، React Router، i18n (فارسی/انگلیسی) |

**تصمیم‌های معماری فعلی (کنترل هزینه در فاز ۱):**
Redis و NATS/JetStream فعلاً از استک حذف شده‌اند. جزئیات و معیار بازگشتشان در [`MITRA.md`](./MITRA.md) آمده.

---

## پیش‌نیازها

- Go 1.27+
- Node.js 20+
- Docker (برای اجرای PostgreSQL محلی) — یا یک Postgres نصب‌شده به‌صورت جداگانه
- [golang-migrate CLI](https://github.com/golang-migrate/migrate#installation)

---

## راه‌اندازی محلی (Backend)

```bash
# ۱. دیتابیس رو بالا بیار
docker compose up -d postgres

# ۲. env رو تنظیم کن
cp .env.example .env
# JWT_SECRET رو حتماً با یک مقدار امن و تصادفی جایگزین کن

# ۳. migration ها رو اجرا کن
export DATABASE_URL="postgres://mitra:mitra@localhost:5432/mitra?sslmode=disable"
migrate -database "$DATABASE_URL" -path internal/db/migrations up

# ۴. سرور رو اجرا کن
go run ./cmd/api
# health check: curl http://localhost:8080/health
```

> سرویس‌های `migrate`، `api` و `web` هم در `docker-compose.yaml` تعریف شده‌اند، اما اجرای کاملشان با `docker compose up` نیازمند `Dockerfile` برای `api` و `web` است که هنوز اضافه نشده‌اند. تا آن موقع، مسیر بالا (اجرای مستقیم با `go run`) روش پیشنهادی توسعه است.

---

## راه‌اندازی محلی (Frontend)

```bash
cd web
npm install
npm run dev
```

---

## API (فعلاً پیاده‌سازی‌شده)

پایه: `/api/v1`

### Auth
| Method | مسیر | توضیح |
|---|---|---|
| POST | `/auth/register` | ثبت‌نام |
| POST | `/auth/login` | ورود |

### Organizations *(نیازمند Authorization: Bearer)*
| Method | مسیر | توضیح |
|---|---|---|
| POST | `/organizations` | ساخت سازمان |
| GET | `/organizations/by-slug/:slug` | گرفتن سازمان با slug |
| GET | `/organizations/:id/members` | لیست اعضا |
| DELETE | `/organizations/:id/members/:user_id` | حذف عضو |
| POST | `/organizations/:id/projects` | ساخت پروژه در سازمان |
| GET | `/organizations/:id/projects` | لیست پروژه‌های سازمان |

### Projects
| Method | مسیر | توضیح |
|---|---|---|
| GET | `/projects/:id` | جزئیات پروژه |
| PUT | `/projects/:id` | ویرایش پروژه |
| DELETE | `/projects/:id` | حذف (soft) پروژه |
| GET | `/projects/:id/members` | لیست اعضای پروژه |
| POST | `/projects/:id/members` | افزودن عضو |
| DELETE | `/projects/:id/members/:user_id` | حذف عضو |
| POST | `/projects/:id/tasks` | ساخت تسک در پروژه |
| GET | `/projects/:id/tasks` | لیست تسک‌های پروژه |

### Tasks
| Method | مسیر | توضیح |
|---|---|---|
| GET | `/tasks/assigned-to-me` | تسک‌های تخصیص‌یافته به من |
| GET | `/tasks/:id` | جزئیات تسک |
| PUT | `/tasks/:id` | ویرایش تسک |
| PATCH | `/tasks/:id/status` | تغییر وضعیت |
| POST | `/tasks/:id/assign/user` | تخصیص به کاربر |
| POST | `/tasks/:id/unassign` | لغو تخصیص |
| DELETE | `/tasks/:id` | حذف (soft) |
| GET | `/tasks/:id/comments` | لیست کامنت‌های تسک |
| POST | `/tasks/:id/comments` | ثبت کامنت |

### Comments
| Method | مسیر | توضیح |
|---|---|---|
| PUT | `/comments/:id` | ویرایش کامنت |
| DELETE | `/comments/:id` | حذف کامنت |

---

## محدودیت‌های شناخته‌شده (فاز ۱)

- بدون `/auth/refresh` — توکن access منقضی‌شده فعلاً نیاز به login مجدد دارد.
- Presence/Realtime/Push notification هنوز پیاده نشده‌اند (فاز ۲).
- بدون Redis/NATS — دلیل و جایگزین موقت در `MITRA.md`.
- `Dockerfile` برای سرویس‌های `api` و `web` هنوز ساخته نشده؛ اجرای local با `go run` / `npm run dev` است.

نقشه‌ی کامل فازبندی و تصمیمات معماری در [`MITRA.md`](./MITRA.md).
