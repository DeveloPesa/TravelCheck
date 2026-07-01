import { Router } from 'express';
import { searchAirports } from '../services/airportCatalog.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const query = String(req.query.search || '');
    const limit = Math.min(Number(req.query.limit || 12), 25);

    res.json(await searchAirports(query, limit));
  } catch (error) {
    next(error);
  }
});

export default router;
