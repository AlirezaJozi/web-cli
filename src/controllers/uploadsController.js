import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  // نام تصادفی تا نام اصلی فایل کاربر لو نرود و تداخل ایجاد نشود
  filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}.${ALLOWED[file.mimetype]}`),
});

export const upload = multer({
  storage,
  limits: {
    fileSize: env.UPLOAD_MAX_SIZE_MB * 1024 * 1024,
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED[file.mimetype]) return cb(null, true);
    cb(new ApiError(400, 'فقط فرمت‌های jpg، png و webp مجاز هستند'));
  },
});

/** POST /api/admin/uploads — فیلد(ها)ی فرم با نام files */
export function uploadImages(req, res, next) {
  try {
    if (!req.files?.length) throw new ApiError(400, 'فایلی ارسال نشد');
    const data = req.files.map((f) => ({
      url: `/uploads/${f.filename}`,
      name: f.filename,
      size: f.size,
    }));
    res.status(201).json({ success: true, message: 'آپلود انجام شد', data });
  } catch (err) {
    next(err);
  }
}
