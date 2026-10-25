import { query } from '../config/db.js';

/** GET /api/admin/stats — آمار خلاصه داشبورد */
export async function getStats(req, res, next) {
  try {
    const [[appt]] = await query(
      `SELECT
         COUNT(*) AS total_appointments,
         COALESCE(SUM(status = 'NEW'), 0) AS new_appointments,
         COALESCE(SUM(status = 'CONFIRMED'), 0) AS confirmed_appointments
       FROM appointments`
    );
    const [[svc]] = await query(
      `SELECT COUNT(*) AS total_services, COALESCE(SUM(is_active = 1), 0) AS active_services
       FROM services`
    );

    res.json({
      success: true,
      message: 'ok',
      data: {
        newAppointments: Number(appt.new_appointments),
        totalAppointments: Number(appt.total_appointments),
        confirmedAppointments: Number(appt.confirmed_appointments),
        totalServices: Number(svc.total_services),
        activeServices: Number(svc.active_services),
      },
    });
  } catch (err) {
    next(err);
  }
}
