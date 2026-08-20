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

const router = express.Router();

router.post('/auth/login', adminLogin);
router.get('/auth/me', protectAdmin, getAdminMe);

router.get('/settings', protectAdmin, getSettings);
router.put('/settings', protectAdmin, updateSettings);

router.get('/applications/stats', protectAdmin, getApplicationStats);
router.get('/applications', protectAdmin, listApplications);
router.get('/applications/:id', protectAdmin, getApplication);
router.patch('/applications/:id/status', protectAdmin, updateApplicationStatus);

export default router;
