import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getProfile, updateProfile, submitOnboarding } from '../controllers/seekerController.js';
import { protectSeeker } from '../middleware/seekerAuthMiddleware.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `seeker-profile-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed!'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get('/me', protectSeeker, getProfile);
router.put('/profile', protectSeeker, upload.single('profilePhoto'), updateProfile);
router.post('/submit', protectSeeker, submitOnboarding);

export default router;
