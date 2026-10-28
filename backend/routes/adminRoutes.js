import express from 'express';
import { getSettings, updateSettings } from '../controllers/adminController.js';
import {
  listApplications,
  getApplication,
  updateApplicationStatus,
  getApplicationStats,
} from '../controllers/adminApplicationController.js';
import { adminLogin, getAdminMe } from '../controllers/adminAuthController.js';
import { protectAdmin } from '../middleware/adminAuthMiddleware.js';
import {
  getApplicationDigilockerDocumentFile,
  listApplicationDigilockerDocuments,
} from '../controllers/adminDigilockerDocumentController.js';
import { getAdminTranscript } from '../controllers/agoraTranscriptionController.js';
import { adminSeekerAction, getAdminSeeker, grantAdminSeekerCredits, listAdminSeekerNotifications, listAdminSeekers, markAdminSeekerNotificationRead, updateAdminSeekerStatus } from '../controllers/adminSeekerController.js';
import { adminExpertAction, listAdminExperts, getAdminExpert, updateAdminExpertStatus } from '../controllers/adminExpertController.js';

const router = express.Router();

router.post('/auth/login', adminLogin);
router.get('/auth/me', protectAdmin, getAdminMe);

router.get('/settings', protectAdmin, getSettings);
router.put('/settings', protectAdmin, updateSettings);
router.get('/bookings/:bookingId/transcript', protectAdmin, getAdminTranscript);

// Managed Experts (User Management -> Expert)
router.get('/experts', protectAdmin, adminExpertAction(listAdminExperts));
router.get('/experts/:expertId', protectAdmin, adminExpertAction(getAdminExpert));
router.patch('/experts/:expertId/status', protectAdmin, adminExpertAction(updateAdminExpertStatus));

// Managed Seekers (User Management -> Seeker)
router.get('/seekers', protectAdmin, adminSeekerAction(listAdminSeekers));
router.get('/seekers/:seekerId', protectAdmin, adminSeekerAction(getAdminSeeker));
router.patch('/seekers/:seekerId/status', protectAdmin, adminSeekerAction(updateAdminSeekerStatus));
router.post('/seekers/:seekerId/credits', protectAdmin, adminSeekerAction(grantAdminSeekerCredits));
router.get('/seekers/:seekerId/notifications', protectAdmin, adminSeekerAction(listAdminSeekerNotifications));
router.patch('/seekers/:seekerId/notifications/:notificationId/read', protectAdmin, adminSeekerAction(markAdminSeekerNotificationRead));

router.get('/applications/stats', protectAdmin, getApplicationStats);
router.get('/applications', protectAdmin, listApplications);
router.get('/applications/:id/digilocker-documents', protectAdmin, listApplicationDigilockerDocuments);
router.get('/applications/:id/digilocker-documents/:documentId/file', protectAdmin, getApplicationDigilockerDocumentFile);
router.get('/applications/:id', protectAdmin, getApplication);
router.patch('/applications/:id/status', protectAdmin, updateApplicationStatus);

export default router;
