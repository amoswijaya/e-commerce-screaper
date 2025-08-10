import { Router } from 'express';
import { scrapeController } from '../controllers/scrape.controller.js';

const router = Router();
router.get('/', scrapeController);

export default router;
