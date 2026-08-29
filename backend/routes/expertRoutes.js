import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getProfile,
  updateProfile,
  submitOnboarding,
  suggestOnboardingIdentity,
  recommendOnboardingSkills,
} from '../controllers/expertController.js';
import { protect } from '../middleware/authMiddleware.js';
import { getRequests, updateRequestDecision } from '../controllers/expertRequestController.js';
import {
  getDigilockerKycStatus,
  handleDigilockerCallback,
  startDigilockerKyc,
} from '../controllers/digilockerController.js';
import { connectLinkedin } from '../controllers/linkedinController.js';

const router = express.Router();

// Configure multer disk storage for profile photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    // Ensure upload directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${ext}`);
  }
});

// File filter validation
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed!'));
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
    fieldSize: 256 * 1024,
    fields: 50,
  }
});

// Profile endpoints
router.get('/me', protect, getProfile);
router.put('/profile', protect, upload.single('profilePhoto'), updateProfile);
router.post('/submit', protect, submitOnboarding);
router.post('/onboarding/ai-suggest', protect, suggestOnboardingIdentity);
router.post('/ai-suggest', protect, suggestOnboardingIdentity);
router.post('/onboarding/recommend-skills', protect, recommendOnboardingSkills);
router.post('/recommend-skills', protect, recommendOnboardingSkills);
router.post('/onboarding/linkedin/connect', protect, connectLinkedin);
router.get('/requests', protect, getRequests);
router.patch('/requests/:bookingId/decision', protect, updateRequestDecision);
router.post('/kyc/digilocker/start', protect, startDigilockerKyc);
router.get('/kyc/digilocker/status', protect, getDigilockerKycStatus);
router.get('/kyc/digilocker/callback', handleDigilockerCallback);

export default router;
