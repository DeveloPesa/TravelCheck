<script setup>
import { onMounted, onUnmounted, watch } from 'vue';
import L from 'leaflet';
import { airportCityLabel } from '../services/geo';

const props = defineProps({
  trips: {
    type: Array,
    default: () => []
  }
});

let map;
let layerGroup;
let tileLayer;
let themeObserver;

onMounted(() => {
  map = L.map('travel-map', { scrollWheelZoom: true }).setView([41.9, 12.5], 4);
  applyThemeTiles();
  layerGroup = L.layerGroup().addTo(map);
  renderTrips();

  if (typeof MutationObserver !== 'undefined') {
    themeObserver = new MutationObserver(() => {
      applyThemeTiles();
      renderTrips();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
});

onUnmounted(() => {
  themeObserver?.disconnect();
  map?.remove();
});

watch(() => props.trips, renderTrips, { deep: true });

function hasCoords(place) {
  return Number.isFinite(Number(place?.lat)) && Number.isFinite(Number(place?.lng)) && (Number(place.lat) !== 0 || Number(place.lng) !== 0);
}

function cssVar(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function applyThemeTiles() {
  if (!map) return;

  const theme = document.documentElement?.dataset?.theme || 'dark';
  const url = theme === 'light'
    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  if (tileLayer) {
    map.removeLayer(tileLayer);
  }

  tileLayer = L.tileLayer(url, {
    maxZoom: 20,
    subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map);
}

function renderMarker(point, tripTitle, place) {
  const primaryColor = cssVar('--primary', '#38bdf8');
  const ink = cssVar('--ink', '#f1f4f9');
  const city = airportCityLabel(place);
  const airportName = place?.airportName || place?.airport || '';

  L.circleMarker(point, {
    radius: 7,
    color: primaryColor,
    weight: 2,
    fillColor: primaryColor,
    fillOpacity: 0.35,
    className: 'trip-map-dot'
  })
    .bindPopup(`<strong style="color:${ink}">${city}</strong><br/>${airportName}<br/><small>${tripTitle}</small>`)
    .addTo(layerGroup);
}

function renderTrips() {
  if (!map || !layerGroup) return;

  layerGroup.clearLayers();
  const bounds = [];
  const routeColor = cssVar('--primary', '#38bdf8');
  const glowColor = cssVar('--accent', '#8b7cf6');

  props.trips.forEach((trip) => {
    if (!hasCoords(trip.departure) || !hasCoords(trip.arrival)) return;

    const from = [Number(trip.departure.lat), Number(trip.departure.lng)];
    const to = [Number(trip.arrival.lat), Number(trip.arrival.lng)];
    bounds.push(from, to);

    renderMarker(from, trip.title, trip.departure);
    renderMarker(to, trip.title, trip.arrival);
    L.polyline([from, to], { color: glowColor, weight: 7, opacity: 0.2, lineCap: 'round' }).addTo(layerGroup);
    L.polyline([from, to], { color: routeColor, weight: 3, opacity: 0.88, lineCap: 'round', dashArray: '10 8' }).addTo(layerGroup);
  });

  if (bounds.length) {
    map.fitBounds(bounds, { padding: [34, 34] });
  }
}
</script>

<template>
  <div id="travel-map" class="map"></div>
</template>
