<p align="center">
  <a href="./README.md"><img src="https://img.shields.io/badge/lang-English-blue.svg" alt="English"></a>
  <a href="./README.fa.md"><img src="https://img.shields.io/badge/lang-فارسی-green.svg" alt="فارسی"></a>
</p>

# Mitra

سامانه‌ی مدیریت و ارتباطات سازمانی — **پروژه‌محور**: یک سازمان پروژه دارد، پروژه‌ها عضو و تسک دارند، تسک‌ها به کاربر تخصیص داده می‌شوند.

Backend: Go (Gin) · sqlc · PostgreSQL — Frontend: React + TypeScript (Vite)

> **مدل تک‌سازمانی:** هیچ فرآیند ثبت‌نام خودکار یا «ساخت سازمان» وجود ندارد. تنها سازمان و اکانت owner اولیه‌اش با یک مرحله‌ی seed ساخته می‌شوند (بخش [راه‌اندازی محلی](#راه-اندازی-محلی) را ببینید)؛ از آن به بعد owner اعضا را از طریق API/UI اضافه می‌کند. فعلاً endpoint‌ای به اسم `/auth/register` وجود ندارد.

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
- Go 1.27+ — برای راه‌اندازی دستی (بدون Docker) بک‌اند، **و** برای اجرای یک‌باره‌ی مرحله‌ی seed حتی وقتی بقیه‌چیز با Docker بالا میاد (`cmd/seed` داخل ایمیج Docker بیلد نشده)
- Node.js 20+ — فقط برای راه‌اندازی دستی (بدون Docker) فرانت‌اند
- [golang-migrate CLI](https://github.com/golang-migrate/migrate#installation) — فقط برای راه‌اندازی دستی بک‌اند

---

## راه‌اندازی محلی

### روش الف — Docker (همه‌ی سرویس‌ها)

```bash
cp .env.example .env
# JWT_SECRET الزامیه — اگه خالی بمونه، api اصلاً بالا نمی‌آد.
# مقداری که توی .env.example هست فقط برای localhost مناسبه؛
# برای هر چیزی فراتر از اون، حتماً با یه مقدار random واقعی جایگزینش کن.
# ORG_NAME / ORG_SLUG / OWNER_EMAIL / OWNER_NAME / OWNER_PASSWORD توسط مرحله‌ی seed زیر استفاده می‌شن.

docker compose up --build
```

این دستور همه‌چیز رو بالا می‌آره: `postgres` → migration‌ها خودکار از طریق سرویس `migrate` اجرا می‌شن → `api` روی `http://localhost:8080` → `web` روی `http://localhost:3000`.

> مقدار `VITE_API_URL` که به build سرویس `web` پاس داده می‌شه توی `docker-compose.yaml` پیش‌فرض خالیه، پس فرانت‌اند موقع build روی `http://localhost:8080` fallback می‌کنه. اگه `api` و `web` رو روی هاست‌های جدا دیپلوی می‌کنی، قبل از build مقدار `VITE_API_URL` رو مطابق آدرس واقعی تنظیم کن.

**سازمان و اکانت owner اولیه رو seed کن** (یک‌بار، قبل از هر login لازمه — چون هنوز سرویسی برای این کار توی `docker-compose` تعریف نشده، این مرحله رو باید محلی و روی همون Postgres داکرایز‌شده اجرا کنی):

```bash
export DATABASE_URL="postgres://mitra:mitra@localhost:5432/mitra?sslmode=disable"
go run ./cmd/seed
```

این دستور `ORG_NAME`، `ORG_SLUG`، `OWNER_EMAIL`، `OWNER_NAME` و `OWNER_PASSWORD` رو از `.env` می‌خونه و سازمان به‌همراه owner‌ش رو می‌سازه. اگه از قبل یک سازمان وجود داشته باشه، فقط یک پیام چاپ می‌کنه و کاری نمی‌کنه (یعنی اجرای دوباره‌ش بی‌خطره).

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

# ۴. سازمان و اکانت owner اولیه رو seed کن (یک‌بار، قبل از هر login لازمه)
go run ./cmd/seed

# ۵. سرور رو اجرا کن
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
| POST | `/auth/login` | ورود |
| POST | `/auth/change-password` | تغییر پسورد خودم *(نیازمند Authorization: Bearer)* |

> `/auth/register` وجود نداره. اکانت‌ها یا با مرحله‌ی seed ساخته می‌شن (owner اول) یا توسط ادمین سازمان/پروژه به‌عنوان عضو اضافه می‌شن — بخش [Organizations](#organizations-نیازمند-authorization-bearer) رو ببین. پاسخ login فیلد `must_change_password` رو هم برمی‌گردونه؛ فرانت‌اند کاربرهایی که این فلگ روشنه رو قبل از ورود به صفحه‌ی تغییر اجباری پسورد می‌فرسته.

### Organizations *(نیازمند Authorization: Bearer)*
| Method | مسیر | توضیح |
|---|---|---|
| GET | `/organizations/by-slug/:slug` | گرفتن سازمان با slug |
| GET | `/organizations/:id/members` | لیست اعضا |
| POST | `/organizations/:id/members` | افزودن عضو |
| DELETE | `/organizations/:id/members/:user_id` | حذف عضو |
| POST | `/organizations/:id/projects` | ساخت پروژه در سازمان |
| GET | `/organizations/:id/projects` | لیست پروژه‌های سازمان |

> `POST /organizations` وجود نداره — ساخت خودکار سازمان حذف شده؛ تنها سازمان توسط مرحله‌ی seed ساخته می‌شه.

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
- **بدون ثبت‌نام یا ساخت سازمان به‌صورت خودکار** — فعلاً عمدیه؛ توضیح در بخش [Organizations](#organizations-نیازمند-authorization-bearer).
- **مرحله‌ی seed کانتینریزه نشده** — `cmd/seed` باید با `go run` اجرا بشه (محلی یا در CI)، حتی توی سناریوی Docker؛ هنوز سرویسی براش توی `docker-compose` تعریف نشده.
- Presence/Realtime/Push notification هنوز پیاده نشده‌اند (فاز ۲)، با اینکه صفحات `Chat` و `Notifications` توی فرانت‌اند از قبل ساخته شده‌اند.
- بدون Redis/NATS — دلیل و جایگزین موقت در `MITRA.md`.

نقشه‌ی کامل فازبندی و تصمیمات معماری در [`MITRA.md`](./MITRA.md).