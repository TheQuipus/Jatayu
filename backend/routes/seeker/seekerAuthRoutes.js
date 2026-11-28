import express from 'express';
import {
  register,
  verifyOtp,
  resendOtp,
  resendStatus,
  login,
  googleLogin,
  linkedinLogin,
  getPublicConfig,
} from '../../controllers/seeker/seekerAuthController.js';

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/resend-status', resendStatus);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/linkedin', linkedinLogin);
router.get('/config', getPublicConfig);

export default router;
