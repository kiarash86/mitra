# پروپوزال کامل معماری و برنامه‌ریزی
## Mitra — سامانه مدیریت و ارتباطات سازمانی یکپارچه

> نام محصول: **Mitra**.

---

## ۱. معماری کلی سیستم

```
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  Flutter (Mobile) │   │   React (Web)     │   │ React + Tauri     │
│  Android | iOS     │   │   Browser          │   │ (Desktop)          │
└─────────┬──────────┘   └─────────┬──────────┘   └─────────┬──────────┘
          │                        │                        │
          └────────────────────────┼────────────────────────┘
                                    │ REST / WebSocket
                       ┌────────────▼────────────┐
                       │     بک‌اند (Go / Gin)      │
                       │  Auth | Business Logic    │
                       │  Realtime (gorilla/ws)    │
                       └────────────┬────────────┘
                                    │
                       ┌────────────▼────────────┐
                       │  PostgreSQL | S3          │
                       └────────────────────────────┘
```

> **بازبینی (کنترل هزینه):** Redis و NATS/JetStream فعلاً از استک حذف شدند تا هزینه‌ی زیرساخت در فاز ۱ پایین بماند. جزئیات و جایگزین موقت هرکدام در بخش ۴ آمده است. این تصمیم قابل بازگشت است — هر وقت نیاز مقیاس‌پذیری (چند instance بک‌اند، حجم بالای پیام) واقعی شد، برمی‌گردند.

> **بازبینی (ساختار سازمانی):** مفهوم Team به‌طور کامل از سیستم حذف شد. سلسله‌مراتب حالا `Organization → Project` است، نه `Organization → Team → Project`. عضویت و نقش کاربر مستقیماً در سطح Organization و سطح Project تعریف می‌شود؛ تخصیص تسک هم فقط به کاربر انجام می‌شود (نه به تیم).

### چرا فرانت‌اند به دو کدبیس تقسیم شد
- **Flutter برای موبایل (Android + iOS):** جایی که Flutter واقعاً بالغه — کامپایل native، عملکرد بالا، UI یکسان روی هر دو پلتفرم موبایل با یک کدبیس.
- **React برای وب و دسکتاپ:** به‌جای سه کدبیس جدا، همون اپ React یک‌بار نوشته می‌شود؛ در مرورگر به‌عنوان وب سرو می‌شود و داخل **Tauri** بسته‌بندی می‌شود برای دسکتاپ. این یعنی در عمل فقط **دو کدبیس فرانت** وجود دارد، نه سه تا.
- **چرا نه یک کدبیس واحد برای هر سه؟** چون performance اولویت اول پروژه است. Flutter برای موبایل بهترین گزینه است؛ React+Tauri برای وب/دسکتاپ سبک‌تر و کم‌مصرف‌تر از یک راه‌حل عمومی (مثل Flutter Desktop یا Electron) است.

---

## ۲. Frontend — Mobile (Flutter)

| ماژول | توضیح |
|---|---|
| Auth Module | ورود، مدیریت سشن، refresh token |
| Organization Module | مدیریت سازمان، اعضا |
| Project & Task Module | پروژه‌ها، تسک‌ها، وضعیت‌ها، تخصیص |
| Chat Module | چت داخلی (متصل به WebSocket) |
| Notification Module | اعلان‌های Push و درون‌برنامه‌ای |
| Reporting Module | گزارش فعالیت و داشبورد |
| Permission Layer | کنترل دسترسی در UI بر اساس نقش و scope |

**پشته‌ی فنی:**
- State Management: Riverpod
- Routing: go_router
- Local DB/Cache: Drift (SQLite) برای offline support
- Realtime: web_socket_channel
- Dependency Injection: get_it + injectable

---

## ۳. Frontend — Web & Desktop (React + Tauri)

- **کدبیس مشترک:** یک اپ React برای وب و دسکتاپ.
- **State Management:** پیشنهاد Zustand یا Redux Toolkit (سبک‌تر و مناسب‌تر از Redux کلاسیک).
- **Routing:** React Router.
- **Realtime:** native WebSocket client، هماهنگ با gorilla/websocket سمت بک‌اند.
- **Desktop packaging:** Tauri (WebView سیستم‌عامل، نه Chromium داخلی) — باینری سبک، مصرف رم پایین، استارت‌آپ سریع.
- **نکته‌ی فنی مهم:** چون Desktop از Tauri استفاده می‌کند، اگر نیاز به قابلیت‌های سیستمی خاص (دسترسی فایل، tray icon، auto-update) باشد، بخش کوچکی از تنظیمات باید در لایه‌ی Rust (توسط Tauri) پیکربندی شود — نه توسعه‌ی مداوم Rust، فقط پیکربندی اولیه.

---

## ۴. بک‌اند (Go / Gin) — پشته‌ی فنی نهایی

| حوزه | تصمیم | دلیل |
|---|---|---|
| فریم‌ورک | **Go + Gin** | Concurrency و throughput بالا؛ اولویت اول پروژه performance است |
| Data Access | **sqlc** | SQL دستی، کد Go تایپ‌سیف در build-time، بدون overhead و N+1 پنهان ORM |
| Migration | **golang-migrate / Atlas / using docker(curent) not sure which way**  | مدیریت schema مستقل از sqlc |
| صف پیام | ~~NATS + JetStream~~ → **حذف شد (فاز ۱)** | هزینه‌ی زیرساخت؛ جایگزین موقت: in-process fan-out (پایین را ببینید) |
| Realtime | **gorilla/websocket** | کنترل کامل روی connection lifecycle، بدون overhead فریم‌ورک آماده |
| RBAC | **پیاده‌سازی دستی، scope-aware** | به‌جای یک مدل تخت Organization-level، نقش‌ها روی دو سطح تعریف می‌شوند: Organization / Project — تا یک کاربر بتواند Admin یک پروژه و Member پروژه‌ی دیگر باشد، یا permission سطح پروژه override شود |

### زیرساخت
- **دیتابیس اصلی:** PostgreSQL
- **Session/Auth:** JWT stateless — نیازی به Redis برای session نیست
- **فایل و پیوست:** Object Storage سازگار با S3 (MinIO یا Arvan/Liara)
- **جستجو (فاز بعد):** Elasticsearch یا Meilisearch

### حذف Redis و NATS از فاز ۱ (کنترل هزینه)
هر دو سرویس نگه‌داشته نمی‌شوند تا هزینه‌ی زیرساخت روی MVP اضافه نشود. نقش قبلی هرکدام:

| نقش قبلی | سرویس | جایگزین موقت در فاز ۱ | محدودیت |
|---|---|---|---|
| Presence (Online/Offline) | Redis | in-memory map داخل پروسه‌ی Go | فقط تک-instance؛ با ریستارت پاک می‌شود |
| Session/Cache | Redis | — (اصلاً لازم نبود؛ Auth از اول JWT stateless است) | — |
| Broadcast چت/Realtime | NATS | Hub داخل پروسه (Go channel fan-out) به‌جای pub/sub بیرونی | فقط تک-instance؛ مقیاس افقی بک‌اند را نمی‌دهد |
| صف Push Notification | NATS | صدا زدن مستقیم/sync سرویس FCM از همان هندلر | بدون retry/buffer؛ اگر FCM کند شود روی request تاثیر می‌گذارد |
| Persistence/Replay اعلان حیاتی | NATS JetStream | حذف شده در فاز ۱ | اعلان‌های از‌دست‌رفته در زمان آفلاین بودن کلاینت replay نمی‌شوند |

**معیار بازگشت:** وقتی بک‌اند بیش از یک instance شد (نیاز به presence/broadcast مشترک بین instance ها)، یا صف پیام واقعاً زیر بار قرار گرفت، این دو باید برگردند.

---

## ۵. طراحی دیتابیس (مدل داده اصلی)

```
Organization (سازمان)
 └── OrganizationMember (عضویت کاربر در سازمان + نقش)

User (کاربر)
 └── OrganizationMember (عضویت در سازمان + نقش)

Project (پروژه)
 ├── belongs to Organization
 ├── has many Task
 └── has many ProjectMember

Task (وظیفه)
 ├── belongs to Project
 ├── assigned to User
 ├── has Status (todo, in_progress, review, done)
 ├── has Priority
 └── has many Comment

Chat
 ├── Channel (کانال پروژه‌ای یا گروهی)
 ├── DirectMessage (چت خصوصی)
 ├── Message
 └── MessageDeliveryStatus (sent / delivered / read — برای read receipts)

Notification
 ├── belongs to User
 ├── type (task_assigned, mention, deadline, ...)
 └── read/unread

Role & Permission (RBAC — scope-aware)
 ├── Role (Owner, Admin, Manager, Member, Viewer)
 ├── scope (organization | project)
 └── Permission (per-resource: project.create, task.assign, ...)

ActivityLog (append-only، شبه event-sourcing)
 ├── actor (User)
 ├── action / event_type
 ├── target (Task/Project/...)
 ├── payload (JSON — جزئیات کامل رویداد برای بازسازی تاریخچه)
 └── timestamp
```

### نکات طراحی مهم
- **Multi-tenancy:** هر رکورد به `organization_id` وصل است تا داده‌ی سازمان‌ها کاملاً ایزوله بماند.
- **Soft Delete:** برای تسک‌ها و پروژه‌ها از `deleted_at` استفاده می‌شود.
- **Audit Trail:** `ActivityLog` به‌صورت append-only با payload کامل هر رویداد طراحی می‌شود — نه فقط یک لاگ خطی — تا در آینده بتوان روی آن analytics و گزارش تاریخی بدون migration ساخت.
- **RBAC چندسطحی:** جدول Role مستقیماً به یک `scope_type` + `scope_id` وصل است (نه فقط organization)، تا override در سطح پروژه از روز اول ممکن باشد.
- **Indexing:** روی `organization_id`, `project_id`, `assigned_to`, `status` و کلیدهای پرتکرار در ActivityLog.

---

## ۶. معماری چت (Realtime) — تفصیلی

چون چت یکی از پیچیده‌ترین بخش‌های سیستم است، جداگانه طراحی می‌شود:

- **Connection Management:** هر کلاینت (Flutter/React) یک WebSocket connection نگه می‌دارد؛ gorilla/websocket مسئول lifecycle، reconnect، و heartbeat است.
- **Message Ordering:** هر پیام یک `sequence_id` سطح کانال دارد تا ترتیب زیر بار concurrent تضمین شود.
- **Delivery Guarantee:** پیام‌ها ابتدا در PostgreSQL ذخیره می‌شوند (source of truth)، سپس در فاز ۱ از طریق یک **hub داخل پروسه** (fan-out با Go channel، بدون NATS) به کلاینت‌های متصل broadcast می‌شوند؛ اگر کلاینت آفلاین باشد، در اتصال بعدی از دیتابیس sync می‌شود. *(محدودیت فاز ۱: این روش فقط با یک instance بک‌اند کار می‌کند؛ مقیاس افقی نیازمند برگشت NATS است.)*
- **Read Receipts:** جدول `MessageDeliveryStatus` برای هر پیام/کاربر وضعیت sent/delivered/read را نگه می‌دارد.
- **Presence (Online/Offline):** در فاز ۱ با یک map حافظه‌ای (in-memory، محافظت‌شده با mutex) داخل پروسه‌ی Go پیاده می‌شود، نه Redis و نه PostgreSQL. با ریستارت سرویس پاک می‌شود؛ قابل قبول برای MVP تک-instance.
- **Typing Indicators:** صرفاً event زودگذر روی WebSocket، بدون persistence.

---

## ۷. تست و Observability

- **Unit/Integration Test:** چون sqlc کوئری دستی تولید می‌کند، هر query باید integration test مستقل روی یک دیتابیس تست (testcontainers) داشته باشد.
- **Structured Logging:** خروجی JSON با context (request_id, organization_id) در تمام لاگ‌ها.
- **Tracing:** ردیابی درخواست بین API و NATS consumers (OpenTelemetry).
- **Metrics:** Prometheus + Grafana برای throughput، latency، و وضعیت صف NATS.

---

## ۸. فازبندی پروژه (Roadmap)

### فاز ۱ — MVP هسته‌ای
- [ ] Auth (ثبت‌نام، ورود، مدیریت سازمان)
- [ ] مدیریت اعضای سازمان
- [ ] مدیریت پروژه (CRUD)
- [ ] مدیریت تسک (ایجاد، تخصیص، وضعیت)
- [ ] کامنت روی تسک (REST، بدون realtime)
- [ ] داشبورد ساده
- [ ] RBAC پایه (scope organization/project)
- [ ] Setup اولیه‌ی React (وب) و Flutter (موبایل) روی همان API

### فاز ۲ — ارتباطات و Realtime
- [ ] چت داخلی کامل (طبق معماری بخش ۶ — با in-process hub، بدون NATS)
- [ ] اعلان‌های Push (FCM) به‌صورت sync/مستقیم (بدون صف واسط)
- [ ] بروزرسانی زنده‌ی وضعیت تسک‌ها

### فاز ۳ — دسترسی پیشرفته و گزارش‌گیری
- [ ] تکمیل RBAC (override سطح پروژه)
- [ ] گزارش فعالیت مبتنی بر ActivityLog
- [ ] فیلتر و جستجوی پیشرفته

### فاز ۴ — Desktop و بهینه‌سازی
- [ ] بسته‌بندی Desktop با Tauri روی همان کدبیس React
- [ ] Offline mode کامل (Flutter + Drift sync)
- [ ] بررسی بازگشت Redis/NATS در صورت نیاز واقعی به مقیاس افقی
- [ ] بهینه‌سازی query و caching

---

## ۹. جمع‌بندی تصمیمات نهایی

| حوزه | تصمیم نهایی |
|---|---|
| Mobile | Flutter (Android + iOS) |
| Web | React |
| Desktop | React + Tauri (کدبیس مشترک با وب) |
| Backend | Go + Gin |
| Data Access | sqlc |
| Migration | golang-migrate / Atlas |
| Realtime | gorilla/websocket + in-process hub (بدون NATS، فاز ۱) |
| صف پیام | حذف‌شده در فاز ۱ (کنترل هزینه) — کاندید بازگشت: NATS/JetStream |
| RBAC | پیاده‌سازی دستی، scope-aware (org/project) |
| Database | PostgreSQL |
| Cache/Presence | حذف‌شده در فاز ۱ (کنترل هزینه) — in-memory داخل پروسه؛ کاندید بازگشت: Redis |
| فایل/پیوست | S3-compatible Object Storage |
| Observability | OpenTelemetry + Prometheus/Grafana |
| شروع پروژه | فاز ۱ (MVP) با تمرکز روی Task/Project (پروژه‌محور، بدون Team) |

---

*این سند نسخه‌ی نهایی تصمیمات معماری تا این مرحله است.*
