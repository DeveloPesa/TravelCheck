<script setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Edit3, Plane } from '@lucide/vue';
import TripMap from '../components/TripMap.vue';
import { useTripsStore } from '../stores/trips';
import { airlineLabel, airportCityLabel, countryLabel } from '../services/geo';
import { useUiStore } from '../stores/ui';

const route = useRoute();
const router = useRouter();
const trips = useTripsStore();
const ui = useUiStore();
const trip = computed(() => trips.trips.find((item) => item.id === route.params.id));
const routeTitle = computed(() => trip.value ? `${airportCityLabel(trip.value.departure)} - ${airportCityLabel(trip.value.arrival)}` : '');

function editTrip() {
  if (!trip.value) return;

  router.push({ name: 'dashboard', query: { edit: trip.value.id } });
}

onMounted(async () => {
  if (!trips.trips.length) {
    await trips.fetchTrips();
  }
});
</script>

<template>
  <section v-if="trip">
    <header class="page-header">
      <div>
        <button class="ghost-button" type="button" @click="router.back()">
          <ArrowLeft :size="18" />
          {{ ui.t('detail.back') }}
        </button>
        <h1>{{ routeTitle }}</h1>
        <p>{{ airlineLabel(trip.airline, trip.airlineCode) }} {{ trip.flightNumber }}</p>
      </div>
      <div class="toolbar">
        <button class="button" type="button" @click="editTrip">
          <Edit3 :size="18" />
          {{ ui.t('detail.edit') }}
        </button>
        <Plane :size="42" class="stats-icon" />
      </div>
    </header>

    <div class="grid split-grid">
      <article class="card form-card">
        <h2>{{ ui.t('detail.details') }}</h2>
        <div class="metric-row">
          <div class="metric"><strong>{{ Number(trip.durationHours || 0).toFixed(1) }}</strong><span>{{ ui.t('detail.totals') }}</span></div>
          <div class="metric"><strong>{{ Number(trip.distanceKm || 0).toLocaleString('it-IT') }}</strong><span>km</span></div>
          <div class="metric"><strong>{{ Number(trip.price || 0).toLocaleString('it-IT') }} {{ trip.currency }}</strong><span>{{ ui.t('detail.spend') }}</span></div>
        </div>

        <h2 class="section-title">{{ ui.t('detail.route') }}</h2>
        <p><strong>{{ trip.departure.airportName || trip.departure.airport || 'Aeroporto n.d.' }}</strong> · {{ airportCityLabel(trip.departure) }}, {{ countryLabel(trip.departure.country, ui.locale) }}</p>
        <p><strong>{{ trip.arrival.airportName || trip.arrival.airport || 'Aeroporto n.d.' }}</strong> · {{ airportCityLabel(trip.arrival) }}, {{ countryLabel(trip.arrival.country, ui.locale) }}</p>
        <p class="muted">{{ trip.startDate }} <span v-if="trip.endDate">- {{ trip.endDate }}</span></p>
        <p v-if="trip.timezoneNote" class="timezone-note">{{ trip.timezoneNote }}</p>

        <h2 class="section-title">{{ ui.t('detail.notes') }}</h2>
        <p class="muted">{{ trip.notes || (ui.locale === 'en' ? 'No notes saved.' : 'Nessuna nota salvata.') }}</p>
      </article>

      <TripMap :trips="[trip]" />
    </div>
  </section>

  <section v-else class="empty-state">{{ ui.t('detail.notFound') }}</section>
</template>
