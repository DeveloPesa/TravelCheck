<script setup>
import { computed } from 'vue';
import { ArrowRight, Calendar, Clock, Edit3, Trash2 } from '@lucide/vue';
import { airlineLabel, airportCityLabel, countryLabel } from '../services/geo';
import { useUiStore } from '../stores/ui';

const ui = useUiStore();

const emit = defineEmits(['edit', 'delete']);

const props = defineProps({
  trip: {
    type: Object,
    required: true
  }
});

const trip = computed(() => props.trip);
const routeTitle = computed(() => `${airportCityLabel(trip.value.departure)} - ${airportCityLabel(trip.value.arrival)}`);
</script>

<template>
  <article class="card trip-card">
    <div>
      <h3>{{ routeTitle }}</h3>
      <p class="muted">{{ airlineLabel(trip.airline, trip.airlineCode) }} {{ trip.flightNumber }}</p>
    </div>

    <div class="trip-route">
      <span>
        <strong>{{ trip.departure.airportName || trip.departure.airport }}</strong>
        {{ airportCityLabel(trip.departure) }} · {{ countryLabel(trip.departure.country, ui.locale) }}
      </span>
      <ArrowRight :size="20" />
      <span>
        <strong>{{ trip.arrival.airportName || trip.arrival.airport }}</strong>
        {{ airportCityLabel(trip.arrival) }} · {{ countryLabel(trip.arrival.country, ui.locale) }}
      </span>
    </div>

    <div class="metric-row">
      <div class="metric">
        <Clock :size="17" />
        <strong>{{ Number(trip.durationHours || 0).toFixed(1) }}</strong>
        <span>ore</span>
      </div>
      <div class="metric">
        <Calendar :size="17" />
        <strong>{{ trip.startDate }}</strong>
        <span>data</span>
      </div>
      <div class="metric">
        <strong>{{ Number(trip.distanceKm || 0).toLocaleString('it-IT') }}</strong>
        <span>km</span>
      </div>
    </div>

    <div class="toolbar">
      <RouterLink class="button" :to="{ name: 'trip-detail', params: { id: trip.id } }">{{ ui.t('common.details') }}</RouterLink>
      <button class="ghost-button" type="button" @click="emit('edit', trip)">
        <Edit3 :size="17" />
      </button>
      <button class="danger-button" type="button" @click="emit('delete', trip.id)">
        <Trash2 :size="17" />
      </button>
    </div>
  </article>
</template>
