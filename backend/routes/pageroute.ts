import express from 'express';
import { getUserNames } from '../controllers/pagecontroller';

const router = express.Router();

router.get('/', getUserNames);

export default router;