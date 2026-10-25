import rateLimit from 'express-rate-limit';

const tooManyRequests = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.',
    data: null,
  });
};

const base = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: tooManyRequests,
};

/** محدودیت عمومی همه مسیرهای API */
export const apiLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 500,
});

/** ورود ادمین: ۱۰ تلاش در ۱۵ دقیقه بر اساس IP */
export const loginLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
});

/** تایید/ارسال مجدد OTP: ۱۰ تلاش در ۱۵ دقیقه */
export const otpLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
});

/** ثبت نوبت عمومی: ۵ درخواست در ساعت بر اساس IP */
export const appointmentLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 5,
});
