import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { resolveFlight } from '../services/flightResolver.js';

const router = Router();
router.use(requireAuth);

router.get('/resolve', async (req, res, next) => {
  try {
    res.json(await resolveFlight({
      flightNumber: req.query.flightNumber,
      date: req.query.date
    }));
  } catch (error) {
    next(error);
  }
});

export default router;
