import nodemailer from 'nodemailer';
import { env } from './env.js';

let transporter = null;

if (env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE === 'true',
    auth: env.SMTP_USER && env.SMTP_PASS
      ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
      : undefined,
  });
}

/** ارسال ایمیل — در صورت تنظیم نبودن SMTP خطا می‌دهد */
export async function sendMail({ to, subject, text, html }) {
  if (!transporter) throw new Error('SMTP تنظیم نشده است (SMTP_HOST خالی است)');
  return transporter.sendMail({ from: env.MAIL_FROM, to, subject, text, html });
}

/** ایمیل کد ورود یک‌بارمصرف */
export function sendOtpEmail(to, code, ttlMinutes) {
  return sendMail({
    to,
    subject: 'کد ورود یک‌بارمصرف',
    text: `کد ورود شما: ${code}\nاین کد تا ${ttlMinutes} دقیقه معتبر است. اگر درخواست ورود نداده‌اید، این ایمیل را نادیده بگیرید.`,
    html: `<div dir="rtl" style="font-family:Tahoma,sans-serif">
      <p>کد ورود یک‌بارمصرف شما:</p>
      <p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p>
      <p>این کد تا ${ttlMinutes} دقیقه معتبر است.</p>
      <p style="color:#888;font-size:12px">اگر درخواست ورود نداده‌اید، این ایمیل را نادیده بگیرید.</p>
    </div>`,
  });
}

/** ایمیل اطلاع‌رسانی ثبت نوبت جدید به ادمین */
export function sendAppointmentEmail(to, appt) {
  const lines = [
    `نام: ${appt.first_name} ${appt.last_name}`,
    `موبایل: ${appt.phone}`,
    appt.service_title ? `خدمت: ${appt.service_title}` : 'خدمت: مردد (مشاوره)',
    appt.message ? `پیام: ${appt.message}` : '',
  ].filter(Boolean);
  return sendMail({
    to,
    subject: `نوبت جدید — ${appt.first_name} ${appt.last_name}`,
    text: lines.join('\n'),
    html: `<div dir="rtl" style="font-family:Tahoma,sans-serif">
      <h3>یک درخواست نوبت جدید ثبت شد</h3>
      <ul>${lines.map((l) => `<li>${l}</li>`).join('')}</ul>
    </div>`,
  });
}
