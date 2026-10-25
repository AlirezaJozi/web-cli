# بک‌اند وب‌سایت کلینیک زیبایی

Node.js + Express (ES Modules) + MySQL با `mysql2` (prepared statements، بدون ORM).

## نصب و اجرا

```bash
# ۱) نصب وابستگی‌ها
npm install

# ۲) ساخت دیتابیس و جداول
mysql -u root -p < schema.sql

# ۳) ساخت کاربر دیتابیس (least privilege) و تنظیم env
cp .env.example .env
# فایل .env را ویرایش کنید (DB_USER, DB_PASSWORD, JWT_SECRET, SMTP_*, ADMIN_*)

# ۴) seed (ادمین اولیه + داده نمونه فارسی)
npm run seed

# ۵) اجرا
npm run dev     # توسعه (با reload خودکار)
npm start       # تولید
```

ساختار پوشه:

```
src/
  config/      db.js, env.js, mailer.js
  middleware/  auth.js, validate.js, errorHandler.js, rateLimit.js
  routes/      public.js, admin.js, auth.js
  controllers/ auth, public, services, beforeAfter, appointments, clinic, uploads, stats
  utils/       otp.js, phone.js, escape.js
uploads/       تصاویر آپلودشده (نام تصادفی)
schema.sql     اسکیمای MySQL
seed.js        داده نمونه + ادمین اولیه
app.js         نقطه ورود
```

## نکات امنیتی

- ورود ادمین دو مرحله‌ای: رمز (bcrypt) + کد OTP ایمیلی (`crypto.randomInt`، هش SHA-256، اعتبار ۵ دقیقه، حداکثر ۵ تلاش).
- JWT فقط در کوکی `httpOnly` + `SameSite=Strict` (+ `Secure` در production).
- Rate limit: ورود و OTP (۱۰/۱۵دقیقه)، ثبت نوبت عمومی (۵/ساعت بر اساس IP) + فیلد honeypot.
- پیام خطای لاگین عمومی است (وجود/عدم وجود ایمیل لو نمی‌رود) و جزئیات خطاهای سرور در production مخفی است.
- همه ورودی‌ها با zod اعتبارسنجی، متن‌ها escape و کوئری‌ها فقط prepared statement.

## مسیرهای اصلی

| متد | مسیر | دسترسی |
|---|---|---|
| POST | `/api/admin/auth/login` | عمومی |
| POST | `/api/admin/auth/verify-otp` | عمومی |
| POST | `/api/admin/auth/resend-otp` | عمومی (فاصله ≥ ۶۰ ثانیه) |
| POST | `/api/admin/auth/logout` | عمومی |
| GET | `/api/services?category=&search=` | عمومی |
| GET | `/api/services/:slug` | عمومی (شامل عوارض، FAQ، قبل/بعد) |
| GET | `/api/before-after?serviceId=` | عمومی |
| GET | `/api/clinic` | عمومی |
| POST | `/api/appointments` | عمومی |
| GET/POST/PUT/DELETE | `/api/admin/services[/:id]` | ادمین |
| GET/POST/PUT/DELETE | `/api/admin/before-after[/:id]` | ادمین |
| GET | `/api/admin/appointments` (+`?status=&q=&page=`) | ادمین |
| GET | `/api/admin/appointments/export` | ادمین (CSV) |
| PATCH | `/api/admin/appointments/:id/status` و `/note` | ادمین |
| DELETE | `/api/admin/appointments/:id` | ادمین |
| GET/PUT | `/api/admin/clinic` | ادمین |
| POST | `/api/admin/uploads` | ادمین (jpg/png/webp، حداکثر ۳MB) |
| GET | `/api/admin/stats` | ادمین |

## نمونه curl

```bash
# ۱) مرحله اول ورود — کد OTP ایمیل می‌شود
curl -X POST http://localhost:4000/api/admin/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@clinic.local","password":"ChangeMe123!"}'

# ۲) تأیید OTP و دریافت کوکی نشست
curl -X POST http://localhost:4000/api/admin/auth/verify-otp \
  -H 'Content-Type: application/json' \
  -c cookies.txt \
  -d '{"challengeId":"<UUID از مرحله قبل>","code":"123456"}'

# ۳) فهرست خدمات عمومی با جستجو
curl 'http://localhost:4000/api/services?search=لیزر'

# ۴) ثبت نوبت عمومی (serviceId یا undecided:true)
curl -X POST http://localhost:4000/api/appointments \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"مریم","lastName":"احمدی","phone":"۰۹۱۲۱۲۳۴۵۶۷","serviceId":1,"message":"تماس بعدازظهر"}'

# ۵) آمار داشبورد (با کوکی ادمین)
curl -b cookies.txt http://localhost:4000/api/admin/stats

# ۶) خروجی CSV نوبت‌های جدید
curl -b cookies.txt 'http://localhost:4000/api/admin/appointments/export?status=NEW' -o appointments.csv

# ۷) آپلود تصویر (فیلد فرم: files)
curl -b cookies.txt -X POST http://localhost:4000/api/admin/uploads \
  -F 'files=@photo.jpg'

# ۸) خروج
curl -b cookies.txt -X POST http://localhost:4000/api/admin/auth/logout
```
