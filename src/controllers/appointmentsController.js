import { z } from 'zod';
import { stringify } from 'csv-stringify/sync';
import { query } from '../config/db.js';
import { ApiError } from '../middleware/errorHandler.js';
import { escapeHtml, escapeLike } from '../utils/escape.js';
import { idParamSchema } from './servicesController.js';

export { idParamSchema };

export const appointmentListQuery = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'CONFIRMED', 'CANCELED']).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const statusSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'CONFIRMED', 'CANCELED'], {
    errorMap: () => ({ message: 'وضعیت نامعتبر است' }),
  }),
});

export const noteSchema = z.object({
  adminNote: z.string().trim().max(1000, 'یادداشت حداکثر ۱۰۰۰ کاراکتر باشد').default(''),
});

/** شرط‌ها و پارامترهای مشترک لیست و خروجی CSV */
function buildFilters({ status, q }) {
  const conditions = [];
  const params = [];
  if (status) {
    conditions.push('a.status = ?');
    params.push(status);
  }
  if (q) {
    const like = `%${escapeLike(q)}%`;
    conditions.push('(a.first_name LIKE ? OR a.last_name LIKE ? OR a.phone LIKE ?)');
    params.push(like, like, like);
  }
  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
}

/** GET /api/admin/appointments */
export async function listAppointments(req, res, next) {
  try {
    const { page, limit } = req.query;
    const { where, params } = buildFilters(req.query);

    const [{ total }] = await query(
      `SELECT COUNT(*) AS total FROM appointments a ${where}`,
      params
    );
    const items = await query(
      `SELECT a.id, a.first_name, a.last_name, a.phone, a.service_id, a.undecided,
              a.message, a.status, a.admin_note, a.created_at,
              s.title AS service_title, s.slug AS service_slug
       FROM appointments a
       LEFT JOIN services s ON s.id = a.service_id
       ${where}
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]
    );
    res.json({ success: true, message: 'ok', data: { items, total, page, limit } });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/appointments/export — خروجی CSV با همان فیلترها */
export async function exportAppointmentsCsv(req, res, next) {
  try {
    const { where, params } = buildFilters(req.query);
    const rows = await query(
      `SELECT a.id, a.first_name, a.last_name, a.phone,
              COALESCE(s.title, '') AS service_title, a.undecided,
              a.message, a.status, a.admin_note, a.created_at
       FROM appointments a
       LEFT JOIN services s ON s.id = a.service_id
       ${where}
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT 10000`,
      params
    );

    const csv = stringify(rows, {
      header: true,
      columns: [
        { key: 'id', header: 'شناسه' },
        { key: 'first_name', header: 'نام' },
        { key: 'last_name', header: 'نام خانوادگی' },
        { key: 'phone', header: 'موبایل' },
        { key: 'service_title', header: 'خدمت' },
        { key: 'undecided', header: 'مردد' },
        { key: 'message', header: 'پیام' },
        { key: 'status', header: 'وضعیت' },
        { key: 'admin_note', header: 'یادداشت ادمین' },
        { key: 'created_at', header: 'تاریخ ثبت' },
      ],
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="appointments.csv"');
    // BOM برای نمایش صحیح فارسی در Excel
    res.send('\uFEFF' + csv);
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/admin/appointments/:id/status */
export async function updateAppointmentStatus(req, res, next) {
  try {
    const result = await query(
      'UPDATE appointments SET status = ? WHERE id = ?',
      [req.body.status, req.params.id]
    );
    if (!result.affectedRows) throw new ApiError(404, 'نوبت یافت نشد');
    const rows = await query('SELECT * FROM appointments WHERE id = ? LIMIT 1', [req.params.id]);
    res.json({ success: true, message: 'وضعیت به‌روزرسانی شد', data: rows[0] });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/admin/appointments/:id/note */
export async function updateAppointmentNote(req, res, next) {
  try {
    const result = await query(
      'UPDATE appointments SET admin_note = ? WHERE id = ?',
      [escapeHtml(req.body.adminNote || ''), req.params.id]
    );
    if (!result.affectedRows) throw new ApiError(404, 'نوبت یافت نشد');
    const rows = await query('SELECT * FROM appointments WHERE id = ? LIMIT 1', [req.params.id]);
    res.json({ success: true, message: 'یادداشت ثبت شد', data: rows[0] });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/admin/appointments/:id */
export async function deleteAppointment(req, res, next) {
  try {
    const result = await query('DELETE FROM appointments WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) throw new ApiError(404, 'نوبت یافت نشد');
    res.json({ success: true, message: 'نوبت حذف شد', data: null });
  } catch (err) {
    next(err);
  }
}
