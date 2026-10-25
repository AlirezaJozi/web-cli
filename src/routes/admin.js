import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listServices,
  getService,
  createService,
  updateService,
  deleteService,
  serviceSchema,
  serviceUpdateSchema,
  idParamSchema,
  adminListQuery,
} from '../controllers/servicesController.js';
import {
  listBeforeAfter,
  createBeforeAfter,
  updateBeforeAfter,
  deleteBeforeAfter,
  beforeAfterSchema,
  beforeAfterUpdateSchema,
  beforeAfterListQuery,
} from '../controllers/beforeAfterController.js';
import {
  listAppointments,
  exportAppointmentsCsv,
  updateAppointmentStatus,
  updateAppointmentNote,
  deleteAppointment,
  appointmentListQuery,
  statusSchema,
  noteSchema,
} from '../controllers/appointmentsController.js';
import {
  getClinicAdmin,
  updateClinic,
  clinicSchema,
} from '../controllers/clinicController.js';
import { upload, uploadImages } from '../controllers/uploadsController.js';
import { getStats } from '../controllers/statsController.js';

const router = Router();

// همه مسیرهای زیر نیازمند ورود ادمین هستند
router.use(requireAuth);

// --- خدمات ---
router.get('/services', validate({ query: adminListQuery }), listServices);
router.get('/services/:id', validate({ params: idParamSchema }), getService);
router.post('/services', validate({ body: serviceSchema }), createService);
router.put('/services/:id', validate({ params: idParamSchema, body: serviceUpdateSchema }), updateService);
router.delete('/services/:id', validate({ params: idParamSchema }), deleteService);

// --- نمونه‌های قبل/بعد ---
router.get('/before-after', validate({ query: beforeAfterListQuery }), listBeforeAfter);
router.post('/before-after', validate({ body: beforeAfterSchema }), createBeforeAfter);
router.put('/before-after/:id', validate({ params: idParamSchema, body: beforeAfterUpdateSchema }), updateBeforeAfter);
router.delete('/before-after/:id', validate({ params: idParamSchema }), deleteBeforeAfter);

// --- نوبت‌ها ---
router.get('/appointments/export', validate({ query: appointmentListQuery }), exportAppointmentsCsv);
router.get('/appointments', validate({ query: appointmentListQuery }), listAppointments);
router.patch('/appointments/:id/status', validate({ params: idParamSchema, body: statusSchema }), updateAppointmentStatus);
router.patch('/appointments/:id/note', validate({ params: idParamSchema, body: noteSchema }), updateAppointmentNote);
router.delete('/appointments/:id', validate({ params: idParamSchema }), deleteAppointment);

// --- اطلاعات کلینیک ---
router.get('/clinic', getClinicAdmin);
router.put('/clinic', validate({ body: clinicSchema }), updateClinic);

// --- آپلود تصویر ---
router.post('/uploads', upload.array('files', 5), uploadImages);

// --- آمار ---
router.get('/stats', getStats);

export default router;
