[English](./README.md) · **فارسی**

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

- Docker + Docker Compose — برای راه‌اندازی یکجای همه‌چیز، یا فقط برای اجرای PostgreSQL محلی
- Go 1.27+ — فقط برای راه‌اندازی دستی (بدون Docker) بک‌اند
- Node.js 20+ — فقط برای راه‌اندازی دستی (بدون Docker) فرانت‌اند
- [golang-migrate CLI](https://github.com/golang-migrate/migrate#installation) — فقط برای راه‌اندازی دستی بک‌اند

---

## راه‌اندازی محلی

### روش الف — Docker (همه‌ی سرویس‌ها)

```bash
cp .env.example .env
# اختیاری: یه JWT_SECRET واقعی توی .env بذار — وگرنه یه مقدار پیش‌فرض
# برای dev که توی docker-compose.yaml هاردکد شده استفاده می‌شه (فقط برای localhost مناسبه)

docker compose up --build
```

این دستور همه‌چیز رو بالا می‌آره: `postgres` → migration‌ها خودکار از طریق سرویس `migrate` اجرا می‌شن → `api` روی `http://localhost:8080` → `web` روی `http://localhost:3000`.

> مقدار `VITE_API_URL` که به build سرویس `web` پاس داده می‌شه توی `docker-compose.yaml` پیش‌فرض خالیه، پس فرانت‌اند موقع build روی `http://localhost:8080` fallback می‌کنه. اگه `api` و `web` رو روی هاست‌های جدا دیپلوی می‌کنی، قبل از build مقدار `VITE_API_URL` رو مطابق آدرس واقعی تنظیم کن.

### روش ب — دستی (Backend)

```bash
# ۱. فقط دیتابیس رو بالا بیار
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

### دستی (Frontend)

```bash
cd web
npm install
npm run dev
```

به‌طور پیش‌فرض فرانت‌اند با `http://localhost:8080` صحبت می‌کنه. برای آدرس دیگه، `VITE_API_URL` رو توی `web/.env` ست کن.

---

## API (فعلاً پیاده‌سازی‌شده)

پایه: `/api/v1` (به‌جز `/health` که بدون ورژن است)

### Health
| Method | مسیر | توضیح |
|---|---|---|
| GET | `/health` | چک سلامت سرویس |

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

- **هنوز endpoint مربوط به `/auth/refresh` وجود نداره** — سمت فرانت‌اند، axios client از قبل منطق retry برای صدا زدنش روی خطای ۴۰۱ رو داره، ولی بک‌اند این مسیر رو پیاده نکرده؛ یعنی الان با منقضی‌شدن access token، کاربر مستقیم logout می‌شه و باید دوباره login کنه.
- Presence/Realtime/Push notification هنوز پیاده نشده‌اند (فاز ۲).
- بدون Redis/NATS — دلیل و جایگزین موقت در `MITRA.md`.

نقشه‌ی کامل فازبندی و تصمیمات معماری در [`MITRA.md`](./MITRA.md).
