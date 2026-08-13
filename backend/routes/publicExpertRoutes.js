import express from 'express';
import { getPublicExpert } from '../controllers/publicExpertController.js';

const router = express.Router();

router.get('/:expertId', getPublicExpert);

export default router;
