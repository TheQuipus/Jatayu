import express from 'express';
import { reviewAction, expertReviews, replyToReview } from '../controllers/reviewController.js';
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
import { getRequest, getRequests, updateRequestDecision } from '../controllers/expertRequestController.js';
import {
  getDigilockerKycStatus,
  handleDigilockerCallback,
  startDigilockerKyc,
} from '../controllers/digilockerController.js';
import { connectLinkedin } from '../controllers/linkedinController.js';
import { completeExpertAgoraSession, getExpertAgoraSession } from '../controllers/agoraSessionController.js';
import {
  getExpertTranscript,
  startExpertTranscription,
  stopExpertTranscription,
  storeExpertTranscriptSegment,
} from '../controllers/agoraTranscriptionController.js';
import { expertChat } from '../controllers/bookingChatController.js';
import { exportAccountData, logoutCurrentSession, softDeleteAccount } from '../controllers/expertAccountController.js';
import { getSecurity, updateTwoFactor, updatePassword, logoutOtherSessions, revokeSession, requestContactVerification, verifyContact, getNotificationPreferences, updateNotificationPreferences } from '../controllers/expertSecurityController.js';
import { calendarCallback, connectCalendar, getCalendarConnections, removeCalendarConnection, syncCalendarNow } from '../controllers/expertCalendarController.js';
import { getEarnings } from '../controllers/expertEarningsController.js';

const router = express.Router();
const securityAction = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    console.error('Expert Security Error:', error.message);
    if (!res.headersSent) res.status(500).json({ message: 'Unable to process security request' });
  }
};

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
router.get('/reviews', protect, reviewAction(expertReviews));
router.put('/reviews/:reviewId/reply', protect, reviewAction(replyToReview));
router.get('/security', protect, securityAction(getSecurity));
router.patch('/security/two-factor', protect, securityAction(updateTwoFactor));
router.patch('/security/password', protect, securityAction(updatePassword));
router.post('/security/sessions/logout-others', protect, securityAction(logoutOtherSessions));
router.delete('/security/sessions/:sessionId', protect, securityAction(revokeSession));
router.post('/security/contact/request', protect, securityAction(requestContactVerification));
router.post('/security/contact/verify', protect, securityAction(verifyContact));
router.get('/notification-preferences', protect, securityAction(getNotificationPreferences));
router.put('/notification-preferences', protect, securityAction(updateNotificationPreferences));
router.get('/account/export', protect, securityAction(exportAccountData));
router.post('/account/logout', protect, securityAction(logoutCurrentSession));
router.delete('/account', protect, securityAction(softDeleteAccount));
router.get('/earnings', protect, getEarnings);
router.get('/calendar-connections', protect, getCalendarConnections);
router.post('/calendar-connections/:provider/connect', protect, connectCalendar);
router.delete('/calendar-connections/:provider', protect, removeCalendarConnection);
router.post('/calendar-connections/:provider/sync', protect, syncCalendarNow);
router.get('/calendar-connections/:provider/callback', calendarCallback);
router.put('/profile', protect, upload.single('profilePhoto'), updateProfile);
router.post('/submit', protect, submitOnboarding);
router.post('/onboarding/ai-suggest', protect, suggestOnboardingIdentity);
router.post('/ai-suggest', protect, suggestOnboardingIdentity);
router.post('/onboarding/recommend-skills', protect, recommendOnboardingSkills);
router.post('/recommend-skills', protect, recommendOnboardingSkills);
router.post('/onboarding/linkedin/connect', protect, connectLinkedin);
router.get('/requests', protect, getRequests);
router.get('/requests/:bookingId', protect, getRequest);
router.patch('/requests/:bookingId/decision', protect, updateRequestDecision);
router.post('/requests/:bookingId/session/token', protect, getExpertAgoraSession);
router.post('/requests/:bookingId/session/complete', protect, completeExpertAgoraSession);
router.post('/requests/:bookingId/transcription/start', protect, startExpertTranscription);
router.post('/requests/:bookingId/transcription/stop', protect, stopExpertTranscription);
router.post('/requests/:bookingId/transcription/segments', protect, storeExpertTranscriptSegment);
router.get('/requests/:bookingId/transcript', protect, getExpertTranscript);
router.get('/requests/:bookingId/messages', protect, expertChat.list);
router.post('/requests/:bookingId/messages', protect, expertChat.send);
router.patch('/requests/:bookingId/messages/read', protect, expertChat.read);
router.post('/kyc/digilocker/start', protect, startDigilockerKyc);
router.get('/kyc/digilocker/status', protect, getDigilockerKycStatus);
router.get('/kyc/digilocker/callback', handleDigilockerCallback);

export default router;
