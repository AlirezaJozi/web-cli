import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { env } from './src/config/env.js';
import { apiLimiter } from './src/middleware/rateLimit.js';
import authRoutes from './src/routes/auth.js';
import adminRoutes from './src/routes/admin.js';
import publicRoutes from './src/routes/public.js';
import { notFoundHandler, errorHandler } from './src/middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.disable('x-powered-by');

// امنیت پایه + اجازه خواندن تصاویر آپلودشده از دامنه فرانت
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// سرو تصاویر آپلودشده (فقط فایل، بدون اجرای HTML)
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    index: false,
    dotfiles: 'ignore',
    fallthrough: true,
    maxAge: env.NODE_ENV === 'production' ? '7d' : 0,
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  })
);

// محدودیت عمومی روی کل API
app.use('/api', apiLimiter);

// ترتیب مهم: روت‌های احراز هویت قبل از روت‌های محافظت‌شده ادمین
app.use('/api/admin/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ok', data: { uptime: process.uptime() } });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`✅ Clinic API در حال اجرا: http://localhost:${env.PORT} (${env.NODE_ENV})`);
});
