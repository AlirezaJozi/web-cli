import { z } from 'zod';
import { query } from '../config/db.js';
import { ApiError } from '../middleware/errorHandler.js';
import { escapeHtml } from '../utils/escape.js';
import { idParamSchema } from './servicesController.js';

export { idParamSchema };

export const beforeAfterSchema = z.object({
  serviceId: z.coerce.number().int().positive('خدمت را انتخاب کنید'),
  beforeImage: z.string().trim().min(1, 'تصویر قبل الزامی است').max(255),
  afterImage: z.string().trim().min(1, 'تصویر بعد الزامی است').max(255),
  caption: z.string().trim().max(500).default(''),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(1000000).default(0),
});

export const beforeAfterUpdateSchema = beforeAfterSchema.partial();

export const beforeAfterListQuery = z.object({
  serviceId: z.coerce.number().int().positive().optional(),
});

async function ensureServiceExists(serviceId) {
  const rows = await query('SELECT id FROM services WHERE id = ? LIMIT 1', [serviceId]);
  if (!rows.length) throw new ApiError(400, 'خدمت مورد نظر وجود ندارد');
}

/** GET /api/admin/before-after */
export async function listBeforeAfter(req, res, next) {
  try {
    const { serviceId } = req.query;
    const conditions = [];
    const params = [];
    if (serviceId) {
      conditions.push('ba.service_id = ?');
      params.push(serviceId);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(
      `SELECT ba.*, s.title AS service_title, s.slug AS service_slug
       FROM before_after ba
       LEFT JOIN services s ON s.id = ba.service_id
       ${where}
       ORDER BY ba.sort_order ASC, ba.id DESC`,
      params
    );
    res.json({ success: true, message: 'ok', data: rows });
  } catch (err) {
    next(err);
  }
}

/** POST /api/admin/before-after */
export async function createBeforeAfter(req, res, next) {
  try {
    const { serviceId, beforeImage, afterImage, caption, isPublished, sortOrder } = req.body;
    await ensureServiceExists(serviceId);
    const result = await query(
      `INSERT INTO before_after (service_id, before_image, after_image, caption, is_published, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [serviceId, beforeImage, afterImage, escapeHtml(caption || ''), isPublished ? 1 : 0, sortOrder]
    );
    const rows = await query('SELECT * FROM before_after WHERE id = ? LIMIT 1', [result.insertId]);
    res.status(201).json({ success: true, message: 'نمونه قبل/بعد ایجاد شد', data: rows[0] });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/admin/before-after/:id */
export async function updateBeforeAfter(req, res, next) {
  try {
    const existing = (await query('SELECT * FROM before_after WHERE id = ? LIMIT 1', [req.params.id]))[0];
    if (!existing) throw new ApiError(404, 'نمونه قبل/بعد یافت نشد');

    const serviceId = req.body.serviceId ?? existing.service_id;
    if (serviceId !== existing.service_id) await ensureServiceExists(serviceId);

    await query(
      `UPDATE before_after
       SET service_id = ?, before_image = ?, after_image = ?, caption = ?, is_published = ?, sort_order = ?
       WHERE id = ?`,
      [
        serviceId,
        req.body.beforeImage ?? existing.before_image,
        req.body.afterImage ?? existing.after_image,
        escapeHtml(req.body.caption ?? existing.caption),
        req.body.isPublished !== undefined ? (req.body.isPublished ? 1 : 0) : existing.is_published,
        req.body.sortOrder ?? existing.sort_order,
        req.params.id,
      ]
    );
    const rows = await query('SELECT * FROM before_after WHERE id = ? LIMIT 1', [req.params.id]);
    res.json({ success: true, message: 'نمونه قبل/بعد به‌روزرسانی شد', data: rows[0] });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/admin/before-after/:id */
export async function deleteBeforeAfter(req, res, next) {
  try {
    const result = await query('DELETE FROM before_after WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) throw new ApiError(404, 'نمونه قبل/بعد یافت نشد');
    res.json({ success: true, message: 'نمونه قبل/بعد حذف شد', data: null });
  } catch (err) {
    next(err);
  }
}
