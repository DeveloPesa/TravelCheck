const displayNamesCache = new Map();
const airlineAliases = {
  EJU: 'easyJet',
  EZY: 'easyJet',
  U2: 'easyJet'
};

const preferredCityByIata = {
  BGY: 'Bergamo'
};

const invalidCityTokens = new Set(['il', 'the', 'aeroporto', 'airport']);

export function airportCityLabel(place) {
  const iata = String(place?.iata || place?.airport || '').trim().toUpperCase();
  if (preferredCityByIata[iata]) {
    return preferredCityByIata[iata];
  }

  const city = String(place?.city || '').trim();
  const lowerCity = city.toLowerCase();
  if (city && !/\([^)]+\)/.test(city) && !invalidCityTokens.has(lowerCity) && lowerCity !== 'orio al serio') {
    return city;
  }

  return guessCityFromAirportName(place?.airportName) || city || iata;
}

export function countryLabel(code, locale = 'it') {
  const normalized = String(code || '').trim().toUpperCase();

  if (!normalized) {
    return '';
  }

  if (typeof Intl === 'undefined' || !Intl.DisplayNames) {
    return normalized;
  }

  if (!displayNamesCache.has(locale)) {
    displayNamesCache.set(locale, new Intl.DisplayNames([locale], { type: 'region' }));
  }

  return displayNamesCache.get(locale).of(normalized) || normalized;
}

export function airlineLabel(name, code) {
  const normalizedName = String(name || '').trim();
  const normalizedCode = String(code || normalizedName).trim().toUpperCase();

  if (normalizedName && normalizedName.length > 2 && !airlineAliases[normalizedName.toUpperCase()]) {
    return normalizedName;
  }

  return airlineAliases[normalizedCode] || normalizedName || normalizedCode;
}

function guessCityFromAirportName(airportName) {
  const cleaned = String(airportName || '')
    .replace(/\b(International|Airport|Aerodrome|Airfield)\b/gi, '')
    .replace(/"[^"]*"/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return '';
  }

  const firstToken = cleaned.split(/[,-]/)[0].trim();
  const normalized = firstToken.trim();

  return normalized.split(' ')[0] || normalized || firstToken;
}
