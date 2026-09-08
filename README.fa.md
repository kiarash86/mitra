<p align="center">
  <a href="./README.md"><img src="https://img.shields.io/badge/lang-English-blue.svg" alt="English"></a>
  <a href="./README.fa.md"><img src="https://img.shields.io/badge/lang-فارسی-green.svg" alt="فارسی"></a>
</p>

# Mitra

سامانه‌ی مدیریت کار و ارتباطات — **پروژه‌محور**: دیپلوی تک‌مستأجری است (بدون مفهوم سازمان/tenant)، پروژه‌ها عضو و تسک دارند، تسک‌ها به کاربر تخصیص داده می‌شوند.

Backend: Go (Gin) · sqlc · PostgreSQL — Frontend: React + TypeScript (Vite)

> **مدل تک‌مستأجری:** هیچ فرآیند ثبت‌نام خودکار یا مفهوم چندمستأجری وجود ندارد — این اپ فقط برای یک دیپلوی ساخته شده. اکانت owner اولیه با یک مرحله‌ی seed ساخته می‌شود (بخش [راه‌اندازی محلی](#راه-اندازی-محلی) را ببینید)؛ از آن به بعد owner کاربرها را از طریق API/UI اضافه می‌کند. فعلاً endpoint‌ای به اسم `/auth/register` وجود ندارد.

این یک snapshot از فاز ۱ / MVP است — برای چیزهایی که عمداً هنوز ساخته نشده‌اند به [محدودیت‌های شناخته‌شده](#محدودیت-های-شناخته-شده-فاز-۱) نگاه کن، و برای معماری کامل و roadmap به [`MITRA.md`](./MITRA.md).

---

## فهرست مطالب

- [Mitra](#mitra)
  - [فهرست مطالب](#فهرست-مطالب)
  - [ساختار سلسله‌مراتبی](#ساختار-سلسلهمراتبی)
  - [پشته‌ی فنی](#پشتهی-فنی)
  - [ساختار ریپازیتوری](#ساختار-ریپازیتوری)
  - [پیش‌نیازها](#پیشنیازها)
  - [متغیرهای محیطی](#متغیرهای-محیطی)
  - [راه‌اندازی محلی](#راهاندازی-محلی)
    - [روش الف — Docker (همه‌ی سرویس‌ها)](#روش-الف--docker-همهی-سرویسها)
    - [روش ب — دستی (Backend)](#روش-ب--دستی-backend)
      - [فرانت‌اند embed می‌شه](#فرانتاند-embed-میشه)
    - [دستی (Frontend)](#دستی-frontend)
  - [API (فعلاً پیاده‌سازی‌شده)](#api-فعلاً-پیادهسازیشده)
    - [Health](#health)
    - [Auth](#auth)
    - [Users *(نیازمند Authorization: Bearer)*](#users-نیازمند-authorization-bearer)
    - [Projects](#projects)
    - [Tasks](#tasks)
    - [Comments](#comments)
    - [درخواست‌شده از سمت فرانت‌اند، ولی هنوز پیاده‌سازی نشده روی بک‌اند](#درخواستشده-از-سمت-فرانتاند-ولی-هنوز-پیادهسازی-نشده-روی-بکاند)
  - [نمای کلی فرانت‌اند](#نمای-کلی-فرانتاند)
  - [نقش‌ها و دسترسی‌ها](#نقشها-و-دسترسیها)
  - [محدودیت‌های شناخته‌شده (فاز ۱)](#محدودیتهای-شناختهشده-فاز-۱)
  - [نقشه‌ی راه](#نقشهی-راه)
  - [لایسنس](#لایسنس)

---

## ساختار سلسله‌مراتبی

```
User (نقش سراسری: owner / admin / member / viewer)

Project
  ├── مستقیم زیر دیپلوی است (تک‌مستأجری، بدون سطح Organization)
  ├── ProjectMember (نقش در سطح پروژه: owner / admin / member / viewer)
  └── Task
        ├── assigned to یک User (نه Team — این سیستم فاقد مفهوم Team است)
        ├── status: todo / in_progress / review / done
        ├── priority: low / medium / high / urgent
        └── Comment
```

> این پروژه عمداً بدون سطح «Team» یا «Organization» طراحی شده؛ RBAC فقط در دو سطح `user` (سراسری) و `project` تعریف می‌شود — یک کاربر می‌تواند در یک پروژه admin و در پروژه‌ی دیگر member ساده باشد، مستقل از نقش سراسری‌اش.

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
├── main.go             # تک نقطه‌ی ورود — فقط cmd.Execute() صدا می‌زنه
├── cmd/                # CLI با Cobra: `mitra serve` (سرور API)، `mitra migrate` (up/down/steps/force/version)، `mitra seed`
├── internal/
│   ├── auth/           # login، change-password، صدور/پارس JWT، هش پسورد
│   ├── users/          # دایرکتوری کاربرها (list/create/delete)، پروفایل (me/update-me)
│   ├── project/        # CRUD پروژه + هندلرهای عضو پروژه
│   ├── task/           # CRUD تسک، وضعیت، تخصیص
│   ├── comment/        # کامنت روی تسک
│   ├── rbac/           # چک نقش scope-aware (نقش سراسری کاربر / owner|admin در سطح project)
│   ├── middleware/     # میدل‌ور auth (توکن Bearer → context کاربر)
│   ├── config/         # لود env (caarlos0/env + godotenv)
│   ├── convert/        # هلپرهای مشترک (مثلاً پارس تاریخ با چند فرمت)
│   └── db/
│       ├── migrations/ # مایگریشن‌های SQL با golang-migrate (۰۰۱ تا ۰۰۷)، داخل باینری embed شده
│       ├── migrator/    # wrapper روی golang-migrate که هم `mitra serve` (auto-migrate) و هم `mitra migrate` ازش استفاده می‌کنن
│       ├── queries/    # کوئری‌های SQL دستی برای sqlc
│       └── sqlc/       # کد Go تایپ‌سیف تولیدشده طبق sqlc.yaml
├── web/                # فرانت‌اند React + TypeScript (بخش نمای کلی فرانت‌اند) + embed.go که web/dist رو داخل باینری mitra embed می‌کنه
├── docker-compose.yaml # postgres + api (فرانت‌اند رو build و embed می‌کنه؛ سرویس/پورت جدایی نداره)
├── Dockerfile          # چند مرحله‌ای: اول web/dist رو build می‌کنه، بعد داخل یک باینری واحد `mitra` embed‌ش می‌کنه (serve/migrate/seed همه توش هستن)
├── sqlc.yaml
├── MITRA.md            # پروپوزال کامل معماری و roadmap فازبندی‌شده
├── README.md / README.fa.md
└── .env.example
```

---

## پیش‌نیازها

- Docker + Docker Compose — برای راه‌اندازی یکجای همه‌چیز، یا فقط برای اجرای PostgreSQL محلی
- Go 1.27+ — فقط برای راه‌اندازی دستی (بدون Docker) بک‌اند لازمه؛ migration و seed هم الان جزو ساب‌کامندهای همون باینری `mitra` هستن، پس چیز اضافه‌ای برای نصب لازم نیست
- Node.js 20+ — برای توسعه‌ی فرانت‌اند (`npm run dev`) لازمه، و حداقل یک‌بار هم برای هر `go run . serve`/`go build` محلی (بدون Docker) لازمه، چون `web/dist` رو embed می‌کنه (بخش «فرانت‌اند embed می‌شه» رو ببین)

---

## متغیرهای محیطی

همه‌ی متغیرها توی `.env` هستن (از روی `.env.example` کپی کن). هر سه ساب‌کامند `serve`، `migrate` و `seed` این فایل رو از طریق `internal/config` می‌خونن.

| متغیر | استفاده توسط | توضیح |
|---|---|---|
| `APP_ENV` | serve | `development`، `production` یا `test` — حالت Gin رو تعیین می‌کنه |
| `APP_PORT` | serve | پورتی که API روش گوش می‌ده (پیش‌فرض `8080`) |
| `DATABASE_URL` | serve, migrate, seed | کانکشن‌استرینگ کامل Postgres؛ در صورت ست‌شدن اولویت داره |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` / `DB_SSLMODE` | serve, migrate, seed, docker-compose | برای ساخت کانکشن‌استرینگ / تنظیم کانتینر `postgres` |
| `AUTO_MIGRATE` | serve | پیش‌فرض `true` — یعنی `mitra serve` قبل از قبول‌کردن ریکوئست، خودش migration‌های معلق رو اجرا می‌کنه. برای مدیریت دستی migration ها، بذارش `false` |
| `JWT_SECRET` | serve | **الزامی** — اگه خالی باشه API اصلاً بالا نمی‌آد |
| `JWT_ACCESS_TOKEN_TTL` | serve | طول عمر access token (مثلاً `15m`) |
| `JWT_REFRESH_TOKEN_TTL` | serve | طول عمر refresh token (مثلاً `720h`) — امروز صادر می‌شه ولی هنوز endpoint ‌ی به اسم `/auth/refresh` برای استفاده ازش وجود نداره |
| `OWNER_EMAIL` | seed | ایمیل login برای اکانت owner سیدشده |
| `OWNER_NAME` | seed | نام کامل اکانت owner سیدشده |
| `OWNER_PASSWORD` | seed | پسورد اولیه‌ی اکانت owner سیدشده — بعد از اولین login عوضش کن |

> اگه `OWNER_EMAIL`، `OWNER_NAME` یا `OWNER_PASSWORD` خالی باشن، `mitra seed` فوراً fail می‌کنه. اگه از قبل یوزری وجود داشته باشه، فقط یک پیام چاپ می‌کنه و با کد ۰ خارج می‌شه (یعنی اجرای دوباره‌ش بی‌خطره).

---

## راه‌اندازی محلی

### روش الف — Docker (همه‌ی سرویس‌ها)

```bash
cp .env.example .env
# JWT_SECRET الزامیه — اگه خالی بمونه، api اصلاً بالا نمی‌آد.
# مقداری که توی .env.example هست فقط برای localhost مناسبه؛
# برای هر چیزی فراتر از اون، حتماً با یه مقدار random واقعی جایگزینش کن.
# OWNER_EMAIL / OWNER_NAME / OWNER_PASSWORD توسط مرحله‌ی seed زیر استفاده می‌شن.

docker compose up --build
```

این دستور همه‌چیز رو بالا می‌آره: `postgres` → خود `api` موقع بالا اومدن migration‌های معلق رو اجرا می‌کنه (به `AUTO_MIGRATE` نگاه کن)، فرانت‌اند رو build می‌کنه، و هم API هم UI رو از `http://localhost:8080` سرو می‌کنه.

> فرانت‌اند موقع build داخل باینری `mitra` embed می‌شه (`web/embed.go` رو ببین) و توسط همون پروسه‌ای که API رو سرو می‌کنه، سرو می‌شه — دیگه کانتینر یا پورت جدایی برای فرانت وجود نداره. `web/Dockerfile` و `web/nginx.conf` هنوز موجودن برای حالت نادری که بخوای فرانت رو مستقل هاست کنی (مثلاً پشت CDN)، ولی روند پیش‌فرض Docker بالا ازشون استفاده نمی‌کنه.

**اکانت owner اولیه رو seed کن** (یک‌بار، قبل از هر login لازمه). چون `seed` فقط یه ساب‌کامند از همون باینری `api`ست، مستقیم روی کانتینر در حال اجرا بزنش — نیازی به نصب Go هم نداری:

```bash
docker compose run --rm api ./mitra seed
```

این دستور `OWNER_EMAIL`، `OWNER_NAME` و `OWNER_PASSWORD` رو از `.env` می‌خونه و اکانت owner رو می‌سازه. هر کدوم از این مقادیر رو می‌تونی به‌جای env، به‌صورت flag هم پاس بدی (`--owner-email`، `--owner-name`، `--owner-password`) که در صورت دادن، اولویت با flag ـه — برای اسکریپت‌نویسی/CI بدون دست‌زدن به `.env` مفیده. برای پسورد ترجیحاً همون env رو استفاده کن، چون مقدار flag تو تاریخچه‌ی shell و `ps` قابل دیدنه.

### روش ب — دستی (Backend)

```bash
# ۱. فقط دیتابیس رو بالا بیار
docker compose up -d postgres

# ۲. env رو تنظیم کن
cp .env.example .env
# JWT_SECRET رو حتماً با یک مقدار امن و تصادفی جایگزین کن

# ۳. migration ها رو اجرا کن
export DATABASE_URL="postgres://mitra:mitra@localhost:5432/mitra?sslmode=disable"
go run . migrate up

# ۴. اکانت owner اولیه رو seed کن (یک‌بار، قبل از هر login لازمه)
go run . seed

# ۵. فرانت‌اند رو build کن — حداقل یه‌بار لازمه، چون `go run . serve`
# هرچی الان توی web/dist باشه رو embed می‌کنه (پایین‌تر توضیح داده شده)
cd web && npm install && npm run build && cd ..

# ۶. سرور رو اجرا کن
go run . serve
# UI: http://localhost:8080  ·  health check: curl http://localhost:8080/health
```

> اجرای `go run . migrate up` در اینجا اختیاریه — چون به‌طور پیش‌فرض خودِ `mitra serve` (مرحله‌ی ۶) موقع بالا اومدن migration های معلق رو اجرا می‌کنه. اگه ترجیح می‌دی migration رو جدا مدیریت کنی، همینو صریح بزن و `AUTO_MIGRATE=false` رو هم ست کن. بقیه‌ی ساب‌کامندهای migrate: `go run . migrate down`، `migrate steps <n>`، `migrate force <version>`، `migrate version`.

#### فرانت‌اند embed می‌شه

`web/embed.go` محتوای `web/dist` رو با `go:embed` داخل باینری `mitra` embed می‌کنه، و `mitra serve` مستقیم سرووش می‌کنه — دقیقاً همین باعث می‌شه `docker compose up` هم API هم UI رو از یک پورت بده. یه پیامد برای توسعه‌ی محلی (بدون Docker) داره: **`web/dist` باید یه build واقعی داشته باشه تا `go build`/`go run` توی این ماژول فایل‌های واقعی UI رو سرو کنه.** چون `web/dist` تو گیت ایگنور شده (فقط یه placeholder به اسم `.gitkeep` تِرک شده)، روی یه clone تازه، پکیج بدون مشکل کامپایل می‌شه، فقط تا وقتی مرحله‌ی ۵ بالا رو نزنی چیز واقعی‌ای برای سرو کردن نداره. هر وقت فرانت رو عوض کردی و خواستی `go run . serve` منعکسش کنه، دوباره `npm run build` رو بزن — اینجا live-reload نداریم، اونی که پایین‌تره (`npm run dev`) برای همون کاره.

### دستی (Frontend)

برای توسعه‌ی فعال فرانت‌اند، به‌جای build گرفتن بعد از هر تغییر، سرور dev خود Vite رو بزن:

```bash
cd web
npm install
npm run dev
```

این کار `/api` رو به `http://localhost:8080` پروکسی می‌کنه (طبق `vite.config.ts`) و hot reload هم داری — دست به `web/dist` یا build embedشده نمی‌زنه.

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

> `/auth/register` وجود نداره. اکانت‌ها یا با مرحله‌ی seed ساخته می‌شن (owner اول) یا توسط owner/admin به‌عنوان کاربر جدید اضافه می‌شن — بخش [Users](#users-نیازمند-authorization-bearer) رو ببین. پاسخ login فیلد `must_change_password` رو هم برمی‌گردونه؛ فرانت‌اند کاربرهایی که این فلگ روشنه رو قبل از ورود به صفحه‌ی تغییر اجباری پسورد می‌فرسته.

### Users *(نیازمند Authorization: Bearer)*
| Method | مسیر | توضیح |
|---|---|---|
| GET | `/users/me` | گرفتن پروفایل خودم |
| PATCH | `/users/me` | ویرایش پروفایل خودم (`full_name`) |
| GET | `/users` | لیست همه‌ی کاربرها |
| POST | `/users` | ساخت کاربر جدید (فقط owner/admin؛ فقط owner می‌تونه owner دیگه بسازه) — یک `temp_password` برمی‌گردونه |
| DELETE | `/users/:id` | حذف (soft) یک کاربر (فقط owner/admin؛ نمی‌تونی خودتو حذف کنی؛ فقط owner می‌تونه owner دیگه رو حذف کنه) |

> منبع جدایی به اسم «سازمان» وجود نداره — دیپلوی تک‌مستأجریه، پس این لیست دقیقاً همه‌ی اکانت‌های کاربریه. نقش سراسری (`owner`/`admin`/`member`/`viewer`) مستقیم روی `users.role` نگه داشته می‌شه.

### Projects
| Method | مسیر | توضیح |
|---|---|---|
| POST | `/projects` | ساخت پروژه (فقط owner/admin) |
| GET | `/projects` | لیست همه‌ی پروژه‌ها |
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
| GET | `/v1/notifications` | `api/notifications.ts`، استور notifications |
| PATCH | `/v1/notifications/:id/read` | `api/notifications.ts` |
| PATCH | `/v1/notifications/read-all` | `api/notifications.ts` |
| WS | (یک endpoint وب‌سوکت) | `hooks/use-websocket.ts`، صفحه‌ی چت |

هیچ‌کدوم از این‌ها هنوز هندلر Go متناظر ندارن — بخش [محدودیت‌های شناخته‌شده](#محدودیت-های-شناخته-شده-فاز-۱) رو ببین.

---

## نمای کلی فرانت‌اند

اپ React 19 + TypeScript توی `web/`، با Vite بیلد می‌شه و استایلش با Tailwind CSS 4 هست. تو محیط production، داخل باینری `mitra` embed می‌شه و توسط همون پروسه‌ای که API رو سرو می‌کنه، سرو می‌شه (بخش «فرانت‌اند embed می‌شه» رو ببین) — دیگه سرور/کانتینر جدایی برای فرانت اجرا نمی‌کنی.

- **Routing** (`src/router.tsx`): صفحات auth (`login`، تغییر اجباری پسورد)، داشبورد، لیست/جزئیات پروژه با یک تسک‌بورد، جزئیات تسک، تیم (دایرکتوری/مدیریت کاربرها، روی `/team`)، پروفایل، چت، و اعلان‌ها. `components/guards/RouteGuards.tsx` روی وضعیت auth گیت می‌ذاره.
- **State** (`src/stores/`): یک store مجزای Zustand به‌ازای هر دامنه — `auth`، `users`، `project`، `task`، `notification`، `toast`، `ui`.
- **لایه‌ی API** (`src/api/`): یک axios client سبک (`client.ts`) به‌همراه یک ماژول برای هر منبع (`auth`، `projects`، `tasks`، `comments`، `notifications`، `users`). ماژول `notifications` endpoint‌هایی رو صدا می‌زنه که بک‌اند هنوز نداره (جدول بالا رو ببین).
- **Realtime**: `hooks/use-websocket.ts` یک hook عمومیِ WebSocket با reconnect خودکاره که توی صفحه‌ی چت استفاده می‌شه — بک‌اند هنوز سرور WebSocket نداره (فاز ۲، به [`MITRA.md`](./MITRA.md) نگاه کن).
- **i18n**: `src/i18n/` دیکشنری فارسی (`fa.ts`) و انگلیسی (`en.ts`) رو پشت یک context در React ارائه می‌ده، با کامپوننت‌های هماهنگ با RTL (`DirectionalIcon`، `LanguageSwitcher`) و فونت متغیر Vazirmatn برای فارسی.
- **UI kit**: یک کتابخانه‌ی کامپوننت محلی و کوچیک توی `src/components/ui/` (Button، Card، Modal، Toaster، DonutChart، StatCard و...) به‌جای یک design system بیرونی.
- **Permissions**: `src/lib/permissions.ts` همون چک‌های owner-or-admin بک‌اند (نقش سراسری و سطح project — `canManageUsers`، `canRemoveUser`، `canManageProject`) رو توی فرانت تکرار می‌کنه تا UI اکشن‌هایی که API ردشون می‌کنه رو مخفی نگه داره.

---

## نقش‌ها و دسترسی‌ها

نقش‌ها مقادیر آزاد `VARCHAR` هستن (بدون enum در سطح دیتابیس)، ولی اپ این‌ها رو به‌عنوان مجموعه‌ی معتبر در هر دو سطح در نظر می‌گیره:

| نقش | سطح سراسری (`users.role`) | سطح Project |
|---|---|---|
| `owner` | کنترل کامل؛ یک‌بار توسط مرحله‌ی seed تعیین می‌شه | کنترل کامل روی همون پروژه |
| `admin` | مدیریت کاربرها/پروژه‌ها، در اکثر چک‌ها معادل owner | مدیریت اعضا/تسک‌ها، در اکثر چک‌ها معادل project owner |
| `member` | نقش پیش‌فرض هر کسی که توسط یک owner/admin اضافه بشه | نقش پیش‌فرض هر کسی که به یک پروژه اضافه بشه |
| `viewer` | فقط‌خواندنی (طبق دیاگرام سلسله‌مراتب) | فقط‌خواندنی (طبق دیاگرام سلسله‌مراتب) |

`internal/rbac/policy.go` چک‌هایی رو که واقعاً امروز اجرا می‌شن پیاده کرده: `GetUserRole`/`IsOwnerOrAdmin` (نقش سراسری، مستقیم از `users.role` خونده می‌شه — دیگه جدول عضویت جدایی وجود نداره)، `IsProjectMember`، `IsProjectOwnerOrAdmin` — یعنی اکثر اکشن‌های نوشتنی فعلاً فقط نیاز به «عضو بودن» یا «owner/admin بودن» دارن، نه یک مدل permission کاملاً دانه‌ریز (اون فاز ۳ توی `MITRA.md` هست).

---

## محدودیت‌های شناخته‌شده (فاز ۱)

- **هنوز endpoint مربوط به `/auth/refresh` وجود نداره** — سمت فرانت‌اند، axios client از قبل منطق retry برای صدا زدنش روی خطای ۴۰۱ رو داره، ولی بک‌اند این مسیر رو پیاده نکرده؛ یعنی الان با منقضی‌شدن access token، کاربر مستقیم logout می‌شه و باید دوباره login کنه.
- **بدون ثبت‌نام خودکار** — فعلاً عمدیه، چون دیپلوی تک‌مستأجریه؛ توضیح در بخش [Users](#users-نیازمند-authorization-bearer).
- **مرحله‌ی seed نیاز به اجرای دستی داره** — `mitra seed` باید یک‌بار صریح اجرا بشه (با `docker compose run --rm api ./mitra seed` یا `go run . seed`)؛ خودکار trigger نمی‌شه چون به env varهای `OWNER_*` که هر دیپلوی متفاوته وابسته‌ست.
- **فاصله‌ی فرانت‌اند/بک‌اند** — فرانت از قبل UI، store و API call برای پروفایل کاربر، اعلان‌ها و یک اتصال WebSocket (چت) داره که هیچ‌کدوم هنوز روی بک‌اند وجود ندارن. جدول توی بخش [API](#api-فعلا-پیاده-سازی-شده) رو ببین.
- **Presence/Realtime/Push notification** هنوز پیاده نشده‌اند (فاز ۲).
- **بدون Redis/NATS** — برای کنترل هزینه در فاز ۱ حذف شده؛ دلیل و جایگزین موقت درون‌پروسه‌ای در `MITRA.md`.
- **تست خودکار وجود نداره** توی این snapshot (`internal/`، `web/`) — کوئری‌های sqlc و هندلرها هنوز integration test ندارن.

---

## نقشه‌ی راه

خلاصه‌شده از [`MITRA.md`](./MITRA.md) (جزئیات و دلیل کامل همون‌جاست):

1. **فاز ۱ — MVP هسته‌ای** *(فعلی)*: auth، CRUD کاربر/پروژه/تسک، کامنت تسک، داشبورد ساده، RBAC scope-aware. ✅ اکثراً تمومه، خلاءهاش بالا لیست شده.
2. **فاز ۲ — ارتباطات و Realtime**: چت داخلی روی WebSocket (hub درون‌پروسه، بدون NATS)، push notification (صدا زدن مستقیم FCM، بدون صف)، آپدیت زنده‌ی وضعیت تسک‌ها.
3. **فاز ۳ — دسترسی پیشرفته و گزارش‌گیری**: RBAC کامل با override سطح پروژه، گزارش‌گیری مبتنی بر activity log، فیلتر و جستجوی پیشرفته.
4. **فاز ۴ — دسکتاپ و بهینه‌سازی**: بسته‌بندی دسکتاپ با Tauri روی همون کدبیس React، offline mode کامل برای اپ موبایل Flutter (برنامه‌ریزی‌شده)، بازبینی برگشت Redis/NATS در صورت نیاز واقعی به مقیاس افقی.

---

## لایسنس

MIT — به [`LICENSE`](./LICENSE) نگاه کن.
