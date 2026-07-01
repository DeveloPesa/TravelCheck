import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import airportRoutes from './routes/airports.js';
import flightRoutes from './routes/flights.js';
import tripRoutes from './routes/trips.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(helmet());
app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'travelcheck-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/airports', airportRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/trips', tripRoutes);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({
    message: status === 500 ? 'Errore interno del server' : err.message
  });
});

app.listen(port, () => {
  console.log(`TravelCheck API pronta su http://localhost:${port}`);
});
