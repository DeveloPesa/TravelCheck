<script setup>
import { computed, onMounted } from 'vue';
import { Building2, Clock, Globe2, MapPinned, Plane } from '@lucide/vue';
import TripMap from '../components/TripMap.vue';
import { useTripsStore } from '../stores/trips';
import { countryLabel } from '../services/geo';
import { useUiStore } from '../stores/ui';

const trips = useTripsStore();
const ui = useUiStore();
const timezoneHighlights = computed(() => trips.trips.filter((trip) => trip.timezoneNote).map((trip) => trip.timezoneNote));

onMounted(() => {
  trips.fetchTrips();
});
</script>

<template>
  <section>
    <header class="page-header">
      <div>
        <h1>{{ ui.t('stats.title') }}</h1>
        <p>{{ ui.t('stats.subtitle') }}</p>
      </div>
    </header>

    <div class="grid stats-grid">
      <article class="card stat-card">
        <Plane :size="22" class="stats-icon" />
        <span>{{ ui.t('stats.flights') }}</span>
        <strong>{{ trips.trips.length }}</strong>
      </article>
      <article class="card stat-card">
        <Clock :size="22" class="stats-icon" />
        <span>{{ ui.t('stats.hours') }}</span>
        <strong>{{ trips.totalHours.toFixed(1) }}</strong>
      </article>
      <article class="card stat-card">
        <Globe2 :size="22" class="stats-icon" />
        <span>{{ ui.t('stats.states') }}</span>
        <strong>{{ trips.countries.length }}</strong>
      </article>
      <article class="card stat-card">
        <MapPinned :size="22" class="stats-icon" />
        <span>{{ ui.t('stats.cities') }}</span>
        <strong>{{ trips.cities.length }}</strong>
      </article>
    </div>

    <div class="grid split-grid" style="margin-top: 16px">
      <TripMap :trips="trips.trips" />

      <article class="card atlas-card">
        <div class="atlas-header">
          <div>
            <p class="eyebrow">{{ ui.t('stats.atlasEyebrow') }}</p>
            <h2>{{ ui.t('stats.atlasTitle') }}</h2>
            <p class="muted">{{ ui.t('stats.atlasLead') }}</p>
          </div>
          <Globe2 :size="28" class="stats-icon" />
        </div>

        <div class="atlas-visual">
          <div class="atlas-grid"></div>
          <span class="atlas-route route-1"></span>
          <span class="atlas-route route-2"></span>
          <span class="atlas-node node-1"></span>
          <span class="atlas-node node-2"></span>
          <span class="atlas-node node-3"></span>
          <span class="atlas-node node-4"></span>
        </div>

        <h3><Globe2 :size="18" /> {{ ui.t('stats.visitedStates') }}</h3>
        <div class="place-list">
          <span v-for="country in trips.countries" :key="country" class="pill pill-country">{{ countryLabel(country, ui.locale) }}</span>
        </div>

        <h3><MapPinned :size="18" /> {{ ui.t('stats.visitedCities') }}</h3>
        <div class="place-list">
          <span v-for="city in trips.cities" :key="city" class="pill">{{ city }}</span>
        </div>

        <h3><Building2 :size="18" /> {{ ui.t('stats.airports') }}</h3>
        <div class="place-list">
          <span v-for="airport in trips.airports" :key="airport" class="pill">{{ airport }}</span>
        </div>

        <div v-if="timezoneHighlights.length" class="timezone-panel">
          <h3>{{ ui.t('stats.timezones') }}</h3>
          <div class="place-list">
            <span v-for="note in timezoneHighlights" :key="note" class="pill pill-timezone">{{ note }}</span>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
