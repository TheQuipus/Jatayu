import express from 'express';
import { getPublicExpert, getPublicExperts } from '../controllers/publicExpertController.js';

const router = express.Router();

router.get('/', getPublicExperts);
router.get('/:expertId', getPublicExpert);

export default router;
