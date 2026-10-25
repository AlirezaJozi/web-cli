import 'dotenv/config';
import { z } from 'zod';

// اعتبارسنجی متغیرهای محیطی در شروع برنامه — در صورت نقص، exit
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  FRONTEND_URL: z.string().url('FRONTEND_URL باید یک URL معتبر باشد'),

  DB_HOST: z.string().min(1).default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().default(3306),
  DB_USER: z.string().min(1, 'DB_USER الزامی است'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().min(1, 'DB_NAME الزامی است'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET باید حداقل ۳۲ کاراکتر باشد'),
  JWT_EXPIRES: z.string().default('8h'),
  COOKIE_NAME: z.string().default('clinic_admin_token'),

  ADMIN_EMAIL: z.string().email('ADMIN_EMAIL معتبر نیست'),
  ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD باید حداقل ۸ کاراکتر باشد'),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('no-reply@clinic.local'),
  ADMIN_NOTIFY_EMAIL: z.string().email().optional(),

  OTP_TTL_MINUTES: z.coerce.number().int().min(1).max(30).default(5),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().min(0).default(60),

  UPLOAD_MAX_SIZE_MB: z.coerce.number().int().min(1).max(10).default(3),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ متغیرهای محیطی نامعتبر:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
