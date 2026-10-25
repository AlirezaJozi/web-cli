import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { loginLimiter, otpLimiter } from '../middleware/rateLimit.js';
import {
  login,
  verifyOtp,
  resendOtp,
  logout,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
} from '../controllers/authController.js';

const router = Router();

router.post('/login', loginLimiter, validate({ body: loginSchema }), login);
router.post('/verify-otp', otpLimiter, validate({ body: verifyOtpSchema }), verifyOtp);
router.post('/resend-otp', otpLimiter, validate({ body: resendOtpSchema }), resendOtp);
router.post('/logout', logout);

export default router;
