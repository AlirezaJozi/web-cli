import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../config/db.js';
import { ApiError } from './errorHandler.js';

/** احراز هویت ادمین از روی کوکی httpOnly حاوی JWT */
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[env.COOKIE_NAME];
    if (!token) throw new ApiError(401, 'ابتدا وارد حساب ادمین شوید');

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch {
      throw new ApiError(401, 'نشست نامعتبر یا منقضی است');
    }

    const rows = await query(
      'SELECT id, email FROM admins WHERE id = ? LIMIT 1',
      [payload.sub]
    );
    if (!rows.length) throw new ApiError(401, 'نشست نامعتبر یا منقضی است');

    req.admin = rows[0];
    next();
  } catch (err) {
    next(err);
  }
}
