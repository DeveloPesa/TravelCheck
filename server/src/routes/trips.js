import { Router } from 'express';
import { nanoid } from 'nanoid';
import { requireAuth } from '../middleware/requireAuth.js';
import { distanceKm, findAirport, toTripPlace } from '../services/airportCatalog.js';
import { readDb, writeDb } from '../services/database.js';

const router = Router();
router.use(requireAuth);

async function normalizeTrip(input, ownerId, existing = {}) {
  const now = new Date().toISOString();
  const departure = input.departure || {};
  const arrival = input.arrival || {};
  const departureAirport = await findAirport(departure.airport || departure.iata || departure.icao);
  const arrivalAirport = await findAirport(arrival.airport || arrival.iata || arrival.icao);
  const normalizedDeparture = departureAirport ? toTripPlace(departureAirport) : normalizePlace(departure);
  const normalizedArrival = arrivalAirport ? toTripPlace(arrivalAirport) : normalizePlace(arrival);
  const calculatedDistance = departureAirport && arrivalAirport ? distanceKm(normalizedDeparture, normalizedArrival) : Number(input.distanceKm || 0);
  const title = String(input.title || '').trim() || `${normalizedDeparture.city} - ${normalizedArrival.city}`;

  return {
    id: existing.id || nanoid(),
    ownerId,
    title,
    airline: String(input.airline || '').trim(),
    airlineCode: String(input.airlineCode || '').trim().toUpperCase(),
    flightNumber: String(input.flightNumber || '').trim().toUpperCase(),
    startDate: String(input.startDate || '').trim(),
    endDate: String(input.endDate || '').trim(),
    departureTime: String(input.departureTime || '').trim(),
    arrivalTime: String(input.arrivalTime || '').trim(),
    departureTimeUtc: String(input.departureTimeUtc || '').trim(),
    arrivalTimeUtc: String(input.arrivalTimeUtc || '').trim(),
    durationHours: Number(input.durationHours || 0),
    distanceKm: calculatedDistance,
    price: Number(input.price || 0),
    currency: String(input.currency || 'EUR').trim().toUpperCase(),
    notes: String(input.notes || '').trim(),
    timezoneShiftHours: input.timezoneShiftHours === null || input.timezoneShiftHours === undefined ? null : Number(input.timezoneShiftHours),
    timezoneNote: String(input.timezoneNote || '').trim(),
    departure: normalizedDeparture,
    arrival: normalizedArrival,
    createdAt: existing.createdAt || now,
    updatedAt: now
  };
}

function validateTrip(trip) {
  if (!trip.flightNumber || !trip.startDate) {
    return 'Numero volo e data sono obbligatori';
  }

  if (!/^[A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?$/.test(trip.flightNumber)) {
    return 'Inserisci un numero volo valido, ad esempio AZ792 o U24567';
  }

  if (!trip.departure.iata || !trip.arrival.iata) {
    return 'Seleziona aeroporti reali dal catalogo per partenza e arrivo';
  }

  if (trip.departure.iata === trip.arrival.iata) {
    return 'Partenza e arrivo devono essere aeroporti diversi';
  }

  if (trip.durationHours < 0 || trip.distanceKm < 0 || trip.price < 0) {
    return 'Durata, distanza e prezzo non possono essere negativi';
  }

  return null;
}

function normalizePlace(place) {
  return {
    airport: String(place.airport || '').trim().toUpperCase(),
    airportName: String(place.airportName || '').trim(),
    iata: String(place.iata || place.airport || '').trim().toUpperCase(),
    icao: String(place.icao || '').trim().toUpperCase(),
    city: String(place.city || '').trim(),
    country: String(place.country || '').trim(),
    lat: Number(place.lat || 0),
    lng: Number(place.lng || 0)
  };
}

router.get('/', async (req, res, next) => {
  try {
    const db = await readDb();
    const trips = db.trips
      .filter((trip) => trip.ownerId === req.user.sub)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));

    res.json(trips);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const trip = await normalizeTrip(req.body, req.user.sub);
    const validationError = validateTrip(trip);

    if (validationError) {
      return next({ status: 400, message: validationError });
    }

    const db = await readDb();
    db.trips.push(trip);
    await writeDb(db);

    res.status(201).json(trip);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const db = await readDb();
    const trip = db.trips.find((item) => item.id === req.params.id && item.ownerId === req.user.sub);

    if (!trip) {
      return next({ status: 404, message: 'Viaggio non trovato' });
    }

    res.json(trip);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const db = await readDb();
    const index = db.trips.findIndex((item) => item.id === req.params.id && item.ownerId === req.user.sub);

    if (index === -1) {
      return next({ status: 404, message: 'Viaggio non trovato' });
    }

    const trip = await normalizeTrip(req.body, req.user.sub, db.trips[index]);
    const validationError = validateTrip(trip);

    if (validationError) {
      return next({ status: 400, message: validationError });
    }

    db.trips[index] = trip;
    await writeDb(db);

    res.json(trip);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const db = await readDb();
    const before = db.trips.length;
    db.trips = db.trips.filter((trip) => !(trip.id === req.params.id && trip.ownerId === req.user.sub));

    if (db.trips.length === before) {
      return next({ status: 404, message: 'Viaggio non trovato' });
    }

    await writeDb(db);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
