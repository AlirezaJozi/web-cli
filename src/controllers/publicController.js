import { z } from 'zod';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { sendAppointmentEmail } from '../config/mailer.js';
import { ApiError } from '../middleware/errorHandler.js';
import { normalizeIranMobile } from '../utils/phone.js';
import { escapeHtml, escapeLike } from '../utils/escape.js';

// --- اسکیماهای اعتبارسنجی ---
export const listServicesQuery = z.object({
  category: z.string().trim().max(100).optional(),
  search: z.string().trim().max(100).optional(),
});

export const serviceSlugParam = z.object({
  slug: z.string().trim().min(1).max(190),
});

export const beforeAfterQuery = z.object({
  serviceId: z.coerce.number().int().positive().optional(),
});

export const appointmentSchema = z
  .object({
    firstName: z.string().trim().min(2, 'نام را وارد کنید').max(100, 'نام طولانی است'),
    lastName: z.string().trim().min(2, 'نام خانوادگی را وارد کنید').max(100, 'نام خانوادگی طولانی است'),
    phone: z.string().trim().min(10, 'شماره موبایل را وارد کنید').max(20),
    serviceId: z.coerce.number().int().positive().nullish(),
    undecided: z.boolean().optional(),
    message: z.string().trim().max(1000, 'پیام باید حداکثر ۱۰۰۰ کاراکتر باشد').optional().default(''),
    // فیلد honeypot — باید خالی بماند؛ ربات‌ها معمولاً پرش می‌کنند
    website: z.string().max(200).optional().default(''),
  })
  .refine((d) => d.undecided === true || d.serviceId != null, {
    message: 'خدمت مورد نظر را انتخاب کنید یا گزینه «مردد هستم» را علامت بزنید',
    path: ['serviceId'],
  });

/** GET /api/services — فهرست خدمات فعال با فیلتر دسته و جستجو */
export async function listServices(req, res, next) {
  try {
    const { category, search } = req.query;
    const conditions = ['is_active = 1'];
    const params = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    if (search) {
      const like = `%${escapeLike(search)}%`;
      conditions.push('(title LIKE ? OR short_description LIKE ? OR category LIKE ?)');
      params.push(like, like, like);
    }

    const rows = await query(
      `SELECT id, title, slug, category, short_description, cover_image, duration
       FROM services WHERE ${conditions.join(' AND ')}
       ORDER BY sort_order ASC, id ASC`,
      params
    );
    res.json({ success: true, message: 'ok', data: rows });
  } catch (err) {
    next(err);
  }
}

/** GET /api/services/:slug — جزئیات خدمت + عوارض + FAQ + قبل/بعد منتشرشده */
export async function getServiceBySlug(req, res, next) {
  try {
    const rows = await query(
      `SELECT id, title, slug, category, short_description, description, cover_image,
              duration, recovery_time, side_effects, faqs
       FROM services WHERE slug = ? AND is_active = 1 LIMIT 1`,
      [req.params.slug]
    );
    const service = rows[0];
    if (!service) throw new ApiError(404, 'خدمت مورد نظر یافت نشد');

    service.before_after = await query(
      `SELECT id, before_image, after_image, caption
       FROM before_after
       WHERE service_id = ? AND is_published = 1
       ORDER BY sort_order ASC, id ASC`,
      [service.id]
    );

    res.json({ success: true, message: 'ok', data: service });
  } catch (err) {
    next(err);
  }
}

/** GET /api/before-after — نمونه‌های منتشرشده (اختیاری بر اساس خدمت) */
export async function listBeforeAfter(req, res, next) {
  try {
    const { serviceId } = req.query;
    const conditions = ['ba.is_published = 1'];
    const params = [];
    if (serviceId) {
      conditions.push('ba.service_id = ?');
      params.push(serviceId);
    }
    const rows = await query(
      `SELECT ba.id, ba.service_id, ba.before_image, ba.after_image, ba.caption,
              s.title AS service_title, s.slug AS service_slug
       FROM before_after ba
       JOIN services s ON s.id = ba.service_id AND s.is_active = 1
       WHERE ${conditions.join(' AND ')}
       ORDER BY ba.sort_order ASC, ba.id ASC`,
      params
    );
    res.json({ success: true, message: 'ok', data: rows });
  } catch (err) {
    next(err);
  }
}

/** GET /api/clinic — اطلاعات کلینیک و ساعات کاری */
export async function getClinic(req, res, next) {
  try {
    const rows = await query(
      `SELECT name, about, address, phones, email, instagram_url,
              map_lat, map_lng, working_hours
       FROM clinic_info WHERE id = 1 LIMIT 1`
    );
    res.json({ success: true, message: 'ok', data: rows[0] || null });
  } catch (err) {
    next(err);
  }
}

/** POST /api/appointments — ثبت نوبت عمومی */
export async function createAppointment(req, res, next) {
  try {
    const { firstName, lastName, phone, serviceId, undecided, message, website } = req.body;

    // honeypot: پاسخ ساختگی موفق تا ربات متوجه نشود
    if (website) {
      return res.status(201).json({ success: true, message: 'درخواست شما ثبت شد', data: null });
    }

    const normalizedPhone = normalizeIranMobile(phone);
    if (!normalizedPhone) {
      throw new ApiError(400, 'شماره موبایل معتبر نیست (مثال: 09121234567)');
    }

    let finalServiceId = null;
    let serviceTitle = null;
    if (undecided !== true) {
      const svcRows = await query(
        'SELECT id, title FROM services WHERE id = ? AND is_active = 1 LIMIT 1',
        [serviceId]
      );
      if (!svcRows.length) throw new ApiError(400, 'خدمت انتخاب‌شده معتبر نیست');
      finalServiceId = svcRows[0].id;
      serviceTitle = svcRows[0].title;
    }

    const result = await query(
      `INSERT INTO appointments (first_name, last_name, phone, service_id, undecided, message)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        escapeHtml(firstName),
        escapeHtml(lastName),
        normalizedPhone,
        finalServiceId,
        undecided === true ? 1 : 0,
        escapeHtml(message || ''),
      ]
    );

    // اطلاع‌رسانی ایمیلی — خطای ایمیل نباید ثبت نوبت را شکست دهد
    if (env.ADMIN_NOTIFY_EMAIL) {
      try {
        await sendAppointmentEmail(env.ADMIN_NOTIFY_EMAIL, {
          first_name: firstName,
          last_name: lastName,
          phone: normalizedPhone,
          service_title: serviceTitle,
          message: message || '',
        });
      } catch (mailErr) {
        console.error('[MAIL] اطلاع‌رسانی نوبت ناموفق بود:', mailErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'درخواست شما ثبت شد. به‌زودی با شما تماس می‌گیریم.',
      data: { id: result.insertId },
    });
  } catch (err) {
    next(err);
  }
}
