import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  res.json({ ok: true, service: 'ecommerce-scraper', ts: new Date().toISOString() });
});

export default router;
