import { z } from 'zod';
import { query } from '../config/db.js';
import { escapeHtml } from '../utils/escape.js';

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'ساعت باید با فرمت HH:MM باشد');

export const clinicSchema = z.object({
  name: z.string().trim().min(1, 'نام کلینیک الزامی است').max(190),
  about: z.string().trim().max(5000).default(''),
  address: z.string().trim().max(500).default(''),
  phones: z.array(z.string().trim().max(30)).max(10).default([]),
  email: z.union([z.literal(''), z.string().trim().email('ایمیل معتبر نیست')]).default(''),
  instagramUrl: z
    .union([
      z.literal(''),
      z.string().trim().url('آدرس اینستاگرام معتبر نیست').max(500),
    ])
    .default(''),
  mapLat: z.number().min(-90).max(90).nullish(),
  mapLng: z.number().min(-180).max(180).nullish(),
  workingHours: z
    .array(
      z.object({
        day: z.string().trim().min(1, 'نام روز الزامی است').max(20),
        closed: z.boolean(),
        slots: z
          .array(z.object({ open: timeSchema, close: timeSchema }))
          .max(4)
          .default([]),
      })
    )
    .length(7, 'ساعات کاری باید دقیقاً ۷ روز باشد'),
});

/** GET /api/admin/clinic */
export async function getClinicAdmin(req, res, next) {
  try {
    const rows = await query('SELECT * FROM clinic_info WHERE id = 1 LIMIT 1');
    res.json({ success: true, message: 'ok', data: rows[0] || null });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/admin/clinic — upsert تنها ردیف (id=1) */
export async function updateClinic(req, res, next) {
  try {
    const d = req.body;
    await query(
      `INSERT INTO clinic_info
         (id, name, about, address, phones, email, instagram_url, map_lat, map_lng, working_hours)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), about = VALUES(about), address = VALUES(address),
         phones = VALUES(phones), email = VALUES(email), instagram_url = VALUES(instagram_url),
         map_lat = VALUES(map_lat), map_lng = VALUES(map_lng), working_hours = VALUES(working_hours)`,
      [
        escapeHtml(d.name),
        escapeHtml(d.about || ''),
        escapeHtml(d.address || ''),
        JSON.stringify(d.phones || []),
        d.email || '',
        d.instagramUrl || '',
        d.mapLat ?? null,
        d.mapLng ?? null,
        JSON.stringify(
          (d.workingHours || []).map((w) => ({
            day: escapeHtml(w.day),
            closed: !!w.closed,
            slots: (w.slots || []).map((s) => ({ open: s.open, close: s.close })),
          }))
        ),
      ]
    );
    const rows = await query('SELECT * FROM clinic_info WHERE id = 1 LIMIT 1');
    res.json({ success: true, message: 'اطلاعات کلینیک ذخیره شد', data: rows[0] });
  } catch (err) {
    next(err);
  }
}
