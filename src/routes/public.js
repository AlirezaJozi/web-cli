import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { appointmentLimiter } from '../middleware/rateLimit.js';
import {
  listServices,
  getServiceBySlug,
  listBeforeAfter,
  getClinic,
  createAppointment,
  listServicesQuery,
  serviceSlugParam,
  beforeAfterQuery,
  appointmentSchema,
} from '../controllers/publicController.js';

const router = Router();

router.get('/services', validate({ query: listServicesQuery }), listServices);
router.get('/services/:slug', validate({ params: serviceSlugParam }), getServiceBySlug);
router.get('/before-after', validate({ query: beforeAfterQuery }), listBeforeAfter);
router.get('/clinic', getClinic);
router.post('/appointments', appointmentLimiter, validate({ body: appointmentSchema }), createAppointment);

export default router;
