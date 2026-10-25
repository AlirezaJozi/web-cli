import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../config/db.js';
import { env, isProd } from '../config/env.js';
import { sendOtpEmail } from '../config/mailer.js';
import { ApiError } from '../middleware/errorHandler.js';
import { generateOtp, hashOtp, verifyOtpHash } from '../utils/otp.js';

// --- اسکیماهای اعتبارسنجی ---
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('ایمیل معتبر نیست').max(190),
  password: z.string().min(1, 'رمز عبور را وارد کنید').max(100),
});

export const verifyOtpSchema = z.object({
  challengeId: z.string().uuid('شناسه چالش معتبر نیست'),
  code: z.string().trim().regex(/^\d{6}$/, 'کد تأیید باید ۶ رقم باشد'),
});

export const resendOtpSchema = z.object({
  challengeId: z.string().uuid('شناسه چالش معتبر نیست'),
});

// پیام خطای عمومی تا وجود/عدم وجود ایمیل لو نرود
const GENERIC_LOGIN_ERROR = 'ایمیل یا رمز عبور نامعتبر است';

// هش ساختگی برای یکسان‌سازی زمان پاسخ وقتی ایمیل وجود ندارد
const DUMMY_HASH = bcrypt.hashSync('wrong-password-timing-guard', 10);

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: isProd,
  path: '/',
  maxAge: 8 * 60 * 60 * 1000,
};

/** مرحله ۱: بررسی ایمیل/رمز و ارسال کد OTP */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const rows = await query(
      'SELECT id, email, password_hash FROM admins WHERE email = ? LIMIT 1',
      [email]
    );
    const admin = rows[0];

    const ok = await bcrypt.compare(password, admin?.password_hash || DUMMY_HASH);
    if (!admin || !ok) throw new ApiError(401, GENERIC_LOGIN_ERROR);

    const challengeId = crypto.randomUUID();
    const code = generateOtp();
    await query(
      `INSERT INTO otp_challenges (id, admin_id, code_hash, expires_at, last_sent_at)
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), NOW())`,
      [challengeId, admin.id, hashOtp(code), env.OTP_TTL_MINUTES]
    );

    try {
      await sendOtpEmail(admin.email, code, env.OTP_TTL_MINUTES);
    } catch (mailErr) {
      console.error('[MAIL] ارسال کد ورود ناموفق بود:', mailErr.message);
      throw new ApiError(502, 'ارسال کد تأیید ناموفق بود. دوباره تلاش کنید.');
    }

    // فقط challengeId برمی‌گردد — کد هرگز در پاسخ نیست
    res.json({
      success: true,
      message: 'کد تأیید به ایمیل شما ارسال شد',
      data: { challengeId, expiresInMinutes: env.OTP_TTL_MINUTES },
    });
  } catch (err) {
    next(err);
  }
}

/** مرحله ۲: بررسی OTP و صدور JWT در کوکی httpOnly */
export async function verifyOtp(req, res, next) {
  try {
    const { challengeId, code } = req.body;
    const rows = await query(
      `SELECT id, admin_id, code_hash, attempts FROM otp_challenges
       WHERE id = ? AND consumed_at IS NULL AND expires_at > NOW() LIMIT 1`,
      [challengeId]
    );
    const challenge = rows[0];

    // پیام یکسان برای «نامعتبر» و «منقضی» تا اطلاعات لو نرود
    if (!challenge) throw new ApiError(400, 'کد تأیید نامعتبر یا منقضی است. دوباره وارد شوید.');
    if (challenge.attempts >= env.OTP_MAX_ATTEMPTS) {
      throw new ApiError(429, 'تعداد تلاش‌ها بیش از حد مجاز است. دوباره وارد شوید.');
    }

    if (!verifyOtpHash(code, challenge.code_hash)) {
      await query('UPDATE otp_challenges SET attempts = attempts + 1 WHERE id = ?', [challenge.id]);
      throw new ApiError(400, 'کد تأیید نامعتبر یا منقضی است. دوباره وارد شوید.');
    }

    await query('UPDATE otp_challenges SET consumed_at = NOW() WHERE id = ?', [challenge.id]);

    const token = jwt.sign({ sub: challenge.admin_id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES,
    });
    res.cookie(env.COOKIE_NAME, token, COOKIE_OPTIONS);

    res.json({ success: true, message: 'ورود موفق بود', data: null });
  } catch (err) {
    next(err);
  }
}

/** ارسال مجدد کد با فاصله اجباری (پیش‌فرض ۶۰ ثانیه) */
export async function resendOtp(req, res, next) {
  try {
    const { challengeId } = req.body;
    const rows = await query(
      `SELECT id, admin_id, last_sent_at FROM otp_challenges
       WHERE id = ? AND consumed_at IS NULL LIMIT 1`,
      [challengeId]
    );
    const challenge = rows[0];
    if (!challenge) throw new ApiError(400, 'چالش ورود نامعتبر است. دوباره وارد شوید.');

    // بررسی فاصله زمانی بدون لو بردن جزئیات
    const cooldownRows = await query(
      `SELECT TIMESTAMPDIFF(SECOND, last_sent_at, NOW()) AS diff
       FROM otp_challenges WHERE id = ?`,
      [challengeId]
    );
    if ((cooldownRows[0]?.diff ?? 0) < env.OTP_RESEND_COOLDOWN_SECONDS) {
      throw new ApiError(429, 'ارسال مجدد کد زودتر از حد مجاز انجام شد. کمی صبر کنید.');
    }

    const adminRows = await query('SELECT email FROM admins WHERE id = ? LIMIT 1', [challenge.admin_id]);
    if (!adminRows.length) throw new ApiError(400, 'چالش ورود نامعتبر است. دوباره وارد شوید.');

    const code = generateOtp();
    await query(
      `UPDATE otp_challenges
       SET code_hash = ?, attempts = 0, last_sent_at = NOW(),
           expires_at = DATE_ADD(NOW(), INTERVAL ? MINUTE)
       WHERE id = ?`,
      [hashOtp(code), env.OTP_TTL_MINUTES, challengeId]
    );

    try {
      await sendOtpEmail(adminRows[0].email, code, env.OTP_TTL_MINUTES);
    } catch (mailErr) {
      console.error('[MAIL] ارسال مجدد کد ناموفق بود:', mailErr.message);
      throw new ApiError(502, 'ارسال کد تأیید ناموفق بود. دوباره تلاش کنید.');
    }

    res.json({ success: true, message: 'کد تأیید مجدداً ارسال شد', data: null });
  } catch (err) {
    next(err);
  }
}

/** خروج: پاک کردن کوکی */
export function logout(req, res) {
  res.clearCookie(env.COOKIE_NAME, { path: '/', httpOnly: true, sameSite: 'strict', secure: isProd });
  res.json({ success: true, message: 'خروج انجام شد', data: null });
}
