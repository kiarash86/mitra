<p align="center">
  <a href="./README.md"><img src="https://img.shields.io/badge/lang-English-blue.svg" alt="English"></a>
  <a href="./README.fa.md"><img src="https://img.shields.io/badge/lang-فارسی-green.svg" alt="فارسی"></a>
</p>

# Mitra

سامانه‌ی مدیریت و ارتباطات سازمانی — **پروژه‌محور**: یک سازمان پروژه دارد، پروژه‌ها عضو و تسک دارند، تسک‌ها به کاربر تخصیص داده می‌شوند.

Backend: Go (Gin) · sqlc · PostgreSQL — Frontend: React + TypeScript (Vite)

> **مدل تک‌سازمانی:** هیچ فرآیند ثبت‌نام خودکار یا «ساخت سازمان» وجود ندارد. تنها سازمان و اکانت owner اولیه‌اش با یک مرحله‌ی seed ساخته می‌شوند (بخش [راه‌اندازی محلی](#راه-اندازی-محلی) را ببینید)؛ از آن به بعد owner اعضا را از طریق API/UI اضافه می‌کند. فعلاً endpoint‌ای به اسم `/auth/register` وجود ندارد.

این یک snapshot از فاز ۱ / MVP است — برای چیزهایی که عمداً هنوز ساخته نشده‌اند به [محدودیت‌های شناخته‌شده](#محدودیت-های-شناخته-شده-فاز-۱) نگاه کن، و برای معماری کامل و roadmap به [`MITRA.md`](./MITRA.md).

---

## فهرست مطالب

- [ساختار سلسله‌مراتبی](#ساختار-سلسله-مراتبی)
- [پشته‌ی فنی](#پشته-ی-فنی)
- [ساختار ریپازیتوری](#ساختار-ریپازیتوری)
- [پیش‌نیازها](#پیش-نیازها)
- [متغیرهای محیطی](#متغیرهای-محیطی)
- [راه‌اندازی محلی](#راه-اندازی-محلی)
- [API (فعلاً پیاده‌سازی‌شده)](#api-فعلا-پیاده-سازی-شده)
- [نمای کلی فرانت‌اند](#نمای-کلی-فرانت-اند)
- [نقش‌ها و دسترسی‌ها](#نقش-ها-و-دسترسی-ها)
- [محدودیت‌های شناخته‌شده (فاز ۱)](#محدودیت-های-شناخته-شده-فاز-۱)
- [نقشه‌ی راه](#نقشه-ی-راه)
- [لایسنس](#لایسنس)

---

## ساختار سلسله‌مراتبی

```
Organization
  └── OrganizationMember (نقش: owner / admin / member / viewer)

Project
  ├── belongs to Organization
  ├── ProjectMember (نقش در سطح پروژه: owner / admin / member / viewer)
  └── Task
        ├── assigned to یک User (نه Team — این سیستم فاقد مفهوم Team است)
        ├── status: todo / in_progress / review / done
        ├── priority: low / medium / high / urgent
        └── Comment
```

> این پروژه عمداً بدون سطح «Team» طراحی شده؛ RBAC فقط در دو سطح `organization` و `project` تعریف می‌شود — یک کاربر می‌تواند در یک پروژه admin و در پروژه‌ی دیگر member ساده باشد.

---

## پشته‌ی فنی

| بخش | تکنولوژی |
|---|---|
| Backend | Go 1.27 + [Gin](https://gin-gonic.com/) |
| Data Access | [sqlc](https://sqlc.dev/) (بدون ORM) روی [pgx/v5](https://github.com/jackc/pgx) |
| Migration | [golang-migrate](https://github.com/golang-migrate/migrate) |
| Auth | JWT (access + refresh) با [golang-jwt/v5](https://github.com/golang-jwt/jwt)، پسورد با bcrypt |
| Database | PostgreSQL 16 |
| Frontend | React 19 + TypeScript + Vite 8، Tailwind CSS 4 |
| State فرانت‌اند | Zustand (یک store به‌ازای هر دامنه)، React Router 7 |
| i18n | context-based سفارشی، فارسی (`fa`) و انگلیسی (`en`)، UI هماهنگ با RTL |

**تصمیم‌های معماری فعلی (کنترل هزینه در فاز ۱):**
Redis و NATS/JetStream فعلاً از استک حذف شده‌اند. جزئیات و معیار بازگشتشان در [`MITRA.md`](./MITRA.md) آمده.

---

## ساختار ریپازیتوری

```
mitra/
├── cmd/
│   ├── api/            # نقطه‌ی شروع سرور HTTP (route ها، wiring) — main.go
│   └── seed/           # اجرای یک‌باره: ساخت سازمان + اکانت owner
├── internal/
│   ├── auth/           # login، change-password، صدور/پارس JWT، هش پسورد
│   ├── organization/   # هندلرهای سازمان + عضو سازمان
│   ├── project/        # CRUD پروژه + هندلرهای عضو پروژه
│   ├── task/           # CRUD تسک، وضعیت، تخصیص
│   ├── comment/        # کامنت روی تسک
│   ├── rbac/           # چک نقش scope-aware (owner|admin در سطح organization/project)
│   ├── middleware/     # میدل‌ور auth (توکن Bearer → context کاربر)
│   ├── config/         # لود env (caarlos0/env + godotenv)
│   ├── convert/        # هلپرهای مشترک (مثلاً پارس تاریخ با چند فرمت)
│   └── db/
│       ├── migrations/ # مایگریشن‌های SQL با golang-migrate (۰۰۱ تا ۰۰۷)
│       ├── queries/    # کوئری‌های SQL دستی برای sqlc
│       └── sqlc/       # کد Go تایپ‌سیف تولیدشده طبق sqlc.yaml
├── web/                # فرانت‌اند React + TypeScript (بخش نمای کلی فرانت‌اند)
├── docker-compose.yaml # postgres + migrate + api + web
├── Dockerfile          # فقط cmd/api رو بیلد می‌کنه (cmd/seed کانتینریزه نشده)
├── sqlc.yaml
├── MITRA.md            # پروپوزال کامل معماری و roadmap فازبندی‌شده
├── README.md / README.fa.md
└── .env.example
```

---

## پیش‌نیازها

- Docker + Docker Compose — برای راه‌اندازی یکجای همه‌چیز، یا فقط برای اجرای PostgreSQL محلی
- Go 1.27+ — برای راه‌اندازی دستی (بدون Docker) بک‌اند، **و** برای اجرای یک‌باره‌ی مرحله‌ی seed حتی وقتی بقیه‌چیز با Docker بالا میاد (`cmd/seed` داخل ایمیج Docker بیلد نشده)
- Node.js 20+ — فقط برای راه‌اندازی دستی (بدون Docker) فرانت‌اند
- [golang-migrate CLI](https://github.com/golang-migrate/migrate#installation) — فقط برای راه‌اندازی دستی بک‌اند

---

## متغیرهای محیطی

همه‌ی متغیرها توی `.env` هستن (از روی `.env.example` کپی کن). هر دو باینری `api` و `seed` این فایل رو از طریق `internal/config` می‌خونن.

| متغیر | استفاده توسط | توضیح |
|---|---|---|
| `APP_ENV` | api | `development`، `production` یا `test` — حالت Gin رو تعیین می‌کنه |
| `APP_PORT` | api | پورتی که API روش گوش می‌ده (پیش‌فرض `8080`) |
| `DATABASE_URL` | api, seed | کانکشن‌استرینگ کامل Postgres؛ در صورت ست‌شدن اولویت داره |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` / `DB_SSLMODE` | api, docker-compose | برای ساخت کانکشن‌استرینگ / تنظیم کانتینر `postgres` |
| `JWT_SECRET` | api | **الزامی** — اگه خالی باشه API اصلاً بالا نمی‌آد |
| `JWT_ACCESS_TOKEN_TTL` | api | طول عمر access token (مثلاً `15m`) |
| `JWT_REFRESH_TOKEN_TTL` | api | طول عمر refresh token (مثلاً `720h`) — امروز صادر می‌شه ولی هنوز endpoint ‌ی به اسم `/auth/refresh` برای استفاده ازش وجود نداره |
| `ORG_NAME` | seed | نام نمایشی همون یک سازمانی که در اجرای اول ساخته می‌شه |
| `ORG_SLUG` | seed, بیلد web | اسلاگ سازمان؛ به‌عنوان `VITE_ORG_SLUG` به بیلد فرانت‌اند هم پاس داده می‌شه |
| `OWNER_EMAIL` | seed | ایمیل login برای اکانت owner سیدشده |
| `OWNER_NAME` | seed | نام کامل اکانت owner سیدشده |
| `OWNER_PASSWORD` | seed | پسورد اولیه‌ی اکانت owner سیدشده — بعد از اولین login عوضش کن |

> اگه `OWNER_EMAIL`، `OWNER_NAME` یا `OWNER_PASSWORD` خالی باشن، `seed` فوراً fail می‌کنه. اگه از قبل سازمانی وجود داشته باشه، فقط یک پیام چاپ می‌کنه و با کد ۰ خارج می‌شه (یعنی اجرای دوباره‌ش بی‌خطره).

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

این دستور `ORG_NAME`، `ORG_SLUG`، `OWNER_EMAIL`، `OWNER_NAME` و `OWNER_PASSWORD` رو از `.env` می‌خونه و سازمان به‌همراه owner‌ش رو می‌سازه.

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

به‌طور پیش‌فرض فرانت‌اند با `http://localhost:8080` صحبت می‌کنه. برای آدرس دیگه، `VITE_API_URL` رو توی `web/.env` ست کن، و `VITE_ORG_SLUG` رو مطابق `ORG_SLUG` بک‌اند.

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

### درخواست‌شده از سمت فرانت‌اند، ولی هنوز پیاده‌سازی نشده روی بک‌اند
فرانت از قبل کد API/store/hook برای این‌ها رو داره — الان روی این بک‌اند فقط ۴۰۴ برمی‌گردونن:

| Method | مسیر | استفاده‌شده در (فرانت‌اند) |
|---|---|---|
| GET | `/v1/users/me` | `api/users.ts` (صفحه‌ی پروفایل) |
| PATCH | `/v1/users/me` | `api/users.ts` (صفحه‌ی پروفایل) |
| GET | `/v1/notifications` | `api/notifications.ts`، استور notifications |
| PATCH | `/v1/notifications/:id/read` | `api/notifications.ts` |
| PATCH | `/v1/notifications/read-all` | `api/notifications.ts` |
| WS | (یک endpoint وب‌سوکت) | `hooks/use-websocket.ts`، صفحه‌ی چت |

هیچ‌کدوم از این‌ها هنوز هندلر Go متناظر ندارن — بخش [محدودیت‌های شناخته‌شده](#محدودیت-های-شناخته-شده-فاز-۱) رو ببین.

---

## نمای کلی فرانت‌اند

اپ React 19 + TypeScript توی `web/`، با Vite بیلد می‌شه و استایلش با Tailwind CSS 4 هست.

- **Routing** (`src/router.tsx`): صفحات auth (`login`، تغییر اجباری پسورد)، داشبورد، لیست/جزئیات پروژه با یک تسک‌بورد، جزئیات تسک، اعضا/تنظیمات سازمان، پروفایل، چت، و اعلان‌ها. `components/guards/RouteGuards.tsx` روی وضعیت auth گیت می‌ذاره؛ `components/organizations/OrgGate.tsx` روی عضویت در سازمان.
- **State** (`src/stores/`): یک store مجزای Zustand به‌ازای هر دامنه — `auth`، `organization`، `project`، `task`، `notification`، `toast`، `ui`.
- **لایه‌ی API** (`src/api/`): یک axios client سبک (`client.ts`) به‌همراه یک ماژول برای هر منبع (`auth`، `organizations`، `projects`، `tasks`، `comments`، `notifications`، `users`). ماژول‌های `notifications` و `users` endpoint‌هایی رو صدا می‌زنن که بک‌اند هنوز نداره (جدول بالا رو ببین).
- **Realtime**: `hooks/use-websocket.ts` یک hook عمومیِ WebSocket با reconnect خودکاره که توی صفحه‌ی چت استفاده می‌شه — بک‌اند هنوز سرور WebSocket نداره (فاز ۲، به [`MITRA.md`](./MITRA.md) نگاه کن).
- **i18n**: `src/i18n/` دیکشنری فارسی (`fa.ts`) و انگلیسی (`en.ts`) رو پشت یک context در React ارائه می‌ده، با کامپوننت‌های هماهنگ با RTL (`DirectionalIcon`، `LanguageSwitcher`) و فونت متغیر Vazirmatn برای فارسی.
- **UI kit**: یک کتابخانه‌ی کامپوننت محلی و کوچیک توی `src/components/ui/` (Button، Card، Modal، Toaster، DonutChart، StatCard و...) به‌جای یک design system بیرونی.
- **Permissions**: `src/lib/permissions.ts` همون چک‌های owner-or-admin بک‌اند (در سطح org/project) رو توی فرانت تکرار می‌کنه تا UI اکشن‌هایی که API ردشون می‌کنه رو مخفی نگه داره.

---

## نقش‌ها و دسترسی‌ها

نقش‌ها مقادیر آزاد `VARCHAR` هستن (بدون enum در سطح دیتابیس)، ولی اپ این‌ها رو به‌عنوان مجموعه‌ی معتبر در هر دو سطح در نظر می‌گیره:

| نقش | سطح Organization | سطح Project |
|---|---|---|
| `owner` | کنترل کامل؛ یک‌بار توسط مرحله‌ی seed تعیین می‌شه | کنترل کامل روی همون پروژه |
| `admin` | مدیریت اعضا/پروژه‌ها، در اکثر چک‌ها معادل owner | مدیریت اعضا/تسک‌ها، در اکثر چک‌ها معادل project owner |
| `member` | نقش پیش‌فرض هر کسی که به سازمان اضافه بشه | نقش پیش‌فرض هر کسی که به یک پروژه اضافه بشه |
| `viewer` | فقط‌خواندنی (طبق دیاگرام سلسله‌مراتب) | فقط‌خواندنی (طبق دیاگرام سلسله‌مراتب) |

`internal/rbac/policy.go` چک‌هایی رو که واقعاً امروز اجرا می‌شن پیاده کرده: `IsOrganizationMember`، `IsOrganizationOwnerOrAdmin`، `IsProjectMember`، `IsProjectOwnerOrAdmin` — یعنی اکثر اکشن‌های نوشتنی فعلاً فقط نیاز به «عضو بودن» یا «owner/admin بودن» دارن، نه یک مدل permission کاملاً دانه‌ریز (اون فاز ۳ توی `MITRA.md` هست).

---

## محدودیت‌های شناخته‌شده (فاز ۱)

- **هنوز endpoint مربوط به `/auth/refresh` وجود نداره** — سمت فرانت‌اند، axios client از قبل منطق retry برای صدا زدنش روی خطای ۴۰۱ رو داره، ولی بک‌اند این مسیر رو پیاده نکرده؛ یعنی الان با منقضی‌شدن access token، کاربر مستقیم logout می‌شه و باید دوباره login کنه.
- **بدون ثبت‌نام یا ساخت سازمان به‌صورت خودکار** — فعلاً عمدیه؛ توضیح در بخش [Organizations](#organizations-نیازمند-authorization-bearer).
- **مرحله‌ی seed کانتینریزه نشده** — `cmd/seed` باید با `go run` اجرا بشه (محلی یا در CI)، حتی توی سناریوی Docker؛ هنوز سرویسی براش توی `docker-compose` تعریف نشده.
- **فاصله‌ی فرانت‌اند/بک‌اند** — فرانت از قبل UI، store و API call برای پروفایل کاربر، اعلان‌ها و یک اتصال WebSocket (چت) داره که هیچ‌کدوم هنوز روی بک‌اند وجود ندارن. جدول توی بخش [API](#api-فعلا-پیاده-سازی-شده) رو ببین.
- **Presence/Realtime/Push notification** هنوز پیاده نشده‌اند (فاز ۲).
- **بدون Redis/NATS** — برای کنترل هزینه در فاز ۱ حذف شده؛ دلیل و جایگزین موقت درون‌پروسه‌ای در `MITRA.md`.
- **تست خودکار وجود نداره** توی این snapshot (`internal/`، `web/`) — کوئری‌های sqlc و هندلرها هنوز integration test ندارن.

---

## نقشه‌ی راه

خلاصه‌شده از [`MITRA.md`](./MITRA.md) (جزئیات و دلیل کامل همون‌جاست):

1. **فاز ۱ — MVP هسته‌ای** *(فعلی)*: auth، CRUD سازمان/پروژه/تسک، کامنت تسک، داشبورد ساده، RBAC scope-aware. ✅ اکثراً تمومه، خلاءهاش بالا لیست شده.
2. **فاز ۲ — ارتباطات و Realtime**: چت داخلی روی WebSocket (hub درون‌پروسه، بدون NATS)، push notification (صدا زدن مستقیم FCM، بدون صف)، آپدیت زنده‌ی وضعیت تسک‌ها.
3. **فاز ۳ — دسترسی پیشرفته و گزارش‌گیری**: RBAC کامل با override سطح پروژه، گزارش‌گیری مبتنی بر activity log، فیلتر و جستجوی پیشرفته.
4. **فاز ۴ — دسکتاپ و بهینه‌سازی**: بسته‌بندی دسکتاپ با Tauri روی همون کدبیس React، offline mode کامل برای اپ موبایل Flutter (برنامه‌ریزی‌شده)، بازبینی برگشت Redis/NATS در صورت نیاز واقعی به مقیاس افقی.

---

## لایسنس

MIT — به [`LICENSE`](./LICENSE) نگاه کن.
