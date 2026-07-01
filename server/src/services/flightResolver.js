import { distanceKm, findAirport, toTripPlace } from './airportCatalog.js';

const AIRLABS_BASE_URL = 'https://airlabs.co/api/v9';
const flightCache = new Map();
const airlineCache = new Map();
const countryNames = typeof Intl !== 'undefined' && Intl.DisplayNames ? new Intl.DisplayNames(['it'], { type: 'region' }) : null;
const AIRLINE_PREFIX_ALIASES = {
  EJU: ['U2', 'EZY'],
  EZY: ['U2', 'EJU'],
  U2: ['EJU', 'EZY']
};

export async function resolveFlight({ flightNumber, date }) {
  const normalizedFlightNumber = String(flightNumber || '').trim().toUpperCase().replace(/\s+/g, '');
  const normalizedDate = String(date || '').trim();

  if (!/^[A-Z0-9]{2,3}\d{1,4}[A-Z]?$/.test(normalizedFlightNumber)) {
    throw withStatus(400, 'Inserisci un numero volo valido, ad esempio AZ792');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
    throw withStatus(400, 'Inserisci la data del volo');
  }

  if (!process.env.AIRLABS_API_KEY) {
    throw withStatus(503, 'Configura AIRLABS_API_KEY nel backend per recuperare dati reali del volo');
  }

  return resolveWithAirLabs(normalizedFlightNumber, normalizedDate);
}

async function resolveWithAirLabs(flightNumber, date) {
  const cacheKey = `${flightNumber}:${date}`;

  if (flightCache.has(cacheKey)) {
    return structuredClone(flightCache.get(cacheKey));
  }

  const flightCandidates = buildFlightCandidates(flightNumber);
  const match = await resolveAcrossCandidates(flightCandidates, date);

  if (!match) {
    throw withStatus(404, 'Nessun volo trovato per numero e data indicati');
  }

  const departureCode = getAirportCode(match, 'dep');
  const arrivalCode = getAirportCode(match, 'arr');
  const departureAirport = await findAirport(departureCode);
  const arrivalAirport = await findAirport(arrivalCode);

  if (!departureAirport || !arrivalAirport) {
    throw withStatus(404, 'Volo trovato, ma gli aeroporti non sono presenti nel catalogo locale');
  }

  const departure = toTripPlace(departureAirport);
  const arrival = toTripPlace(arrivalAirport);
  const departureTime = getLocalTime(match, 'dep') || date;
  const arrivalTime = getLocalTime(match, 'arr') || '';
  const departureTimeUtc = getUtcTime(match, 'dep') || '';
  const arrivalTimeUtc = getUtcTime(match, 'arr') || '';
  const airlineCode = String(match.airline_iata || match.airline_icao || '').trim().toUpperCase();
  const airlineName = await resolveAirlineName(airlineCode) || match.airline_name || airlineCode;
  const timezoneShiftHours = calculateTimezoneShiftHours(departureTime, departureTimeUtc, arrivalTime, arrivalTimeUtc);
  const resolved = {
    title: `${departure.city} - ${arrival.city}`,
    airline: airlineName,
    airlineCode,
    flightNumber,
    startDate: toDatePart(departureTime) || date,
    endDate: toDatePart(arrivalTime) || '',
    departureTime,
    arrivalTime,
    departureTimeUtc,
    arrivalTimeUtc,
    durationHours: calculateDurationHours(departureTime, arrivalTime),
    distanceKm: distanceKm(departure, arrival),
    timezoneShiftHours,
    timezoneNote: buildTimezoneNote(departure, arrival, timezoneShiftHours),
    departure,
    arrival,
    provider: 'airlabs'
  };

  flightCache.set(cacheKey, resolved);
  return structuredClone(resolved);
}

async function resolveAcrossCandidates(flightCandidates, date) {
  for (const candidate of flightCandidates) {
    const routeMatch = await resolveFromRoutes(candidate, date);
    if (routeMatch) {
      return routeMatch;
    }
  }

  for (const candidate of flightCandidates) {
    const scheduleMatch = await resolveFromSchedules(candidate, date);
    if (scheduleMatch) {
      return scheduleMatch;
    }
  }

  return null;
}

function buildFlightCandidates(flightNumber) {
  const normalized = String(flightNumber || '').trim().toUpperCase().replace(/\s+/g, '');
  const candidates = new Set([normalized]);
  const match = normalized.match(/^([A-Z0-9]{2,3})(\d{1,4}[A-Z]?)$/);

  if (match) {
    const [, prefix, suffix] = match;
    for (const alias of AIRLINE_PREFIX_ALIASES[prefix] || []) {
      candidates.add(`${alias}${suffix}`);
    }
  }

  return [...candidates];
}

async function resolveFromSchedules(flightNumber, date) {
  const params = new URLSearchParams({
    flight_iata: flightNumber,
    api_key: process.env.AIRLABS_API_KEY
  });
  const response = await fetch(`${AIRLABS_BASE_URL}/schedules?${params.toString()}`, {
    headers: { Accept: 'application/json' }
  });
  const payload = await response.json().catch(() => ([]));

  if (!response.ok || payload.error) {
    return null;
  }

  const flights = extractAirLabsItems(payload);
  return flights.find((item) => matchesDate(item, date) && sameFlight(item, flightNumber)) || flights.find((item) => matchesDate(item, date)) || flights[0] || null;
}

async function resolveFromFlightInfo(flightNumber) {
  const params = new URLSearchParams({
    flight_iata: flightNumber,
    api_key: process.env.AIRLABS_API_KEY
  });
  const response = await fetch(`${AIRLABS_BASE_URL}/flight?${params.toString()}`, {
    headers: { Accept: 'application/json' }
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw withStatus(response.status >= 500 ? 502 : response.status || 502, payload.message || 'Provider voli non disponibile');
  }

  if (payload.error) {
    return null;
  }

  return extractAirLabsItems(payload).find((item) => sameFlight(item, flightNumber)) || extractAirLabsItems(payload)[0] || null;
}

async function resolveFromRoutes(flightNumber, date) {
  const params = new URLSearchParams({
    flight_iata: flightNumber,
    api_key: process.env.AIRLABS_API_KEY
  });
  const response = await fetch(`${AIRLABS_BASE_URL}/routes?${params.toString()}`, {
    headers: { Accept: 'application/json' }
  });
  const payload = await response.json().catch(() => ([]));

  if (!response.ok || payload.error) {
    return null;
  }

  const routes = extractAirLabsItems(payload);
  const weekday = getWeekdayCode(date);
  const route = routes.find((item) => sameFlight(item, flightNumber) && routeRunsOnWeekday(item, weekday))
    || routes.find((item) => sameFlight(item, flightNumber) && routeRunsOnWeekday(item))
    || routes.find((item) => sameFlight(item, flightNumber))
    || routes.find((item) => routeRunsOnWeekday(item, weekday))
    || routes[0];

  if (!route) {
    return null;
  }

  return normalizeRouteMatch(route, date, flightNumber);
}

function normalizeRouteMatch(route, date, flightNumber) {
  const departureTime = combineDateAndTime(date, route.dep_time || route.dep_time_utc);
  const departureTimeUtc = combineDateAndTime(date, route.dep_time_utc || route.dep_time);
  const arrivalTime = combineDateAndTime(date, route.arr_time || route.arr_time_utc);
  const arrivalTimeUtc = combineDateAndTime(date, route.arr_time_utc || route.arr_time);

  return {
    ...route,
    flight_iata: route.flight_iata || flightNumber,
    flight_icao: route.flight_icao || '',
    dep_time: departureTime,
    dep_time_utc: departureTimeUtc,
    arr_time: arrivalTime,
    arr_time_utc: arrivalTimeUtc,
    dep_time_local: departureTime,
    arr_time_local: arrivalTime,
    dep_time_source: route.dep_time || route.dep_time_utc || '',
    arr_time_source: route.arr_time || route.arr_time_utc || ''
  };
}

function sameFlight(item, flightNumber) {
  return String(item.flight_iata || item.flight_icao || item.number || '').toUpperCase().replace(/\s+/g, '') === flightNumber;
}

function matchesDate(item, date) {
  return toDatePart(item.dep_time_utc || item.dep_time || item.arr_time_utc || item.arr_time || '') === date;
}

function getAirportCode(item, prefix) {
  return String(item?.[`${prefix}_iata`] || item?.[`${prefix}_icao`] || '').trim().toUpperCase();
}

function getMovementTime(item, prefix) {
  return item?.[`${prefix}_time_utc`] || item?.[`${prefix}_time`] || item?.[`${prefix}_estimated_utc`] || item?.[`${prefix}_estimated`] || item?.[`${prefix}_actual_utc`] || item?.[`${prefix}_actual`] || '';
}

function getLocalTime(item, prefix) {
  return item?.[`${prefix}_time_local`] || item?.[`${prefix}_time`] || item?.[`${prefix}_estimated`] || item?.[`${prefix}_actual`] || item?.[`${prefix}_time_utc`] || '';
}

function getUtcTime(item, prefix) {
  return item?.[`${prefix}_time_utc`] || item?.[`${prefix}_estimated_utc`] || item?.[`${prefix}_actual_utc`] || '';
}

async function resolveAirlineName(airlineCode) {
  if (!airlineCode) {
    return '';
  }

  if (airlineCache.has(airlineCode)) {
    return airlineCache.get(airlineCode);
  }

  const params = new URLSearchParams({
    iata_code: airlineCode,
    api_key: process.env.AIRLABS_API_KEY
  });

  const response = await fetch(`${AIRLABS_BASE_URL}/airlines?${params.toString()}`, {
    headers: { Accept: 'application/json' }
  });
  const payload = await response.json().catch(() => ([]));
  const airlines = extractAirLabsItems(payload);
  const airline = airlines[0];
  const airlineName = airline?.name || '';

  airlineCache.set(airlineCode, airlineName);
  return airlineName;
}

function calculateTimezoneShiftHours(departureLocal, departureUtc, arrivalLocal, arrivalUtc) {
  const departureOffset = calculateOffsetHours(departureLocal, departureUtc);
  const arrivalOffset = calculateOffsetHours(arrivalLocal, arrivalUtc);

  if (departureOffset === null || arrivalOffset === null) {
    return null;
  }

  return arrivalOffset - departureOffset;
}

function calculateOffsetHours(localTime, utcTime) {
  if (!localTime || !utcTime) {
    return null;
  }

  const localMs = Date.parse(String(localTime).replace(' ', 'T'));
  const utcMs = Date.parse(`${String(utcTime).replace(' ', 'T')}Z`);

  if (!Number.isFinite(localMs) || !Number.isFinite(utcMs)) {
    return null;
  }

  return Math.round(((localMs - utcMs) / 36e5) * 10) / 10;
}

function buildTimezoneNote(departure, arrival, shiftHours) {
  if (!Number.isFinite(shiftHours) || shiftHours === 0) {
    return '';
  }

  const absoluteShift = Math.abs(shiftHours);
  const direction = shiftHours > 0 ? 'avanti' : 'indietro';
  const departureLabel = countryLabel(departure.country) || departure.city;
  return `${arrival.city} è ${absoluteShift} ora${absoluteShift === 1 ? '' : 'e'} ${direction} rispetto a ${departureLabel}`;
}

function countryLabel(code) {
  const normalized = String(code || '').trim().toUpperCase();

  if (!normalized) {
    return '';
  }

  return countryNames?.of(normalized) || normalized;
}

function routeRunsOnWeekday(route, weekday) {
  const days = Array.isArray(route?.days) ? route.days.map((day) => String(day || '').toLowerCase()) : [];

  if (!weekday) {
    return days.length > 0;
  }

  return days.includes(weekday);
}

function getWeekdayCode(date) {
  const value = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(value.getTime())) {
    return '';
  }

  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][value.getUTCDay()];
}

function extractAirLabsItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.response)) {
    return payload.response;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (payload && typeof payload === 'object' && payload.response) {
    return [payload.response];
  }

  return [];
}

function combineDateAndTime(date, value) {
  const raw = String(value || '').trim();

  if (!raw) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(raw)) {
    return raw.replace('T', ' ').slice(0, 16);
  }

  const timeMatch = raw.match(/(\d{2}:\d{2})/);
  if (!timeMatch) {
    return raw;
  }

  return `${date} ${timeMatch[1]}`;
}

function toDatePart(value) {
  return String(value || '').slice(0, 10);
}

function calculateDurationHours(start, end) {
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return 0;
  }

  return Math.round(((endMs - startMs) / 36e5) * 10) / 10;
}

function withStatus(status, message) {
  return Object.assign(new Error(message), { status });
}
