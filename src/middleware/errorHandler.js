import multer from 'multer';
import { ZodError } from 'zod';
import { isProd } from '../config/env.js';

/** خطای اپلیکیشنی با وضعیت و پیام مشخص */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.isApiError = true;
  }
}

/** مسیر پیدا نشد */
export function notFoundHandler(req, res, next) {
  next(new ApiError(404, 'مسیر مورد نظر یافت نشد'));
}

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: 'حجم فایل بیش از حد مجاز است',
  LIMIT_FILE_COUNT: 'تعداد فایل‌ها بیش از حد مجاز است',
  LIMIT_UNEXPECTED_FILE: 'فیلد آپلود نامعتبر است',
};

/** هندلر یکپارچه خطا — خروجی همیشه {success, message, data} */
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let status = 500;
  let message = 'خطای داخلی سرور';

  if (err instanceof ApiError) {
    status = err.status;
    message = err.message;
  } else if (err instanceof ZodError) {
    status = 400;
    message = err.issues[0]?.message || 'ورودی نامعتبر است';
  } else if (err instanceof multer.MulterError) {
    status = 400;
    message = MULTER_MESSAGES[err.code] || 'خطا در آپلود فایل';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'بدنه JSON نامعتبر است';
  } else if (err.status && err.status < 500) {
    status = err.status;
    message = err.message || message;
  }

  // خطاهای سرور لاگ می‌شوند ولی جزئیاتشان در production لو نمی‌رود
  if (status >= 500) console.error('[ERROR]', err);

  res.status(status).json({
    success: false,
    message: status >= 500 && isProd ? 'خطای داخلی سرور' : message,
    data: null,
  });
}
