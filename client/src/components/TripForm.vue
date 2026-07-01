<script setup>
import { computed, reactive, watch } from 'vue';
import { RefreshCw, Save, X } from '@lucide/vue';
import { emptyTrip } from '../stores/trips';
import { airlineLabel, airportCityLabel } from '../services/geo';
import { useUiStore } from '../stores/ui';

const ui = useUiStore();

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => emptyTrip()
  },
  saving: Boolean,
  resolving: Boolean,
  resolveError: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['resolve', 'submit', 'cancel']);
const form = reactive(emptyTrip());

const isEditing = computed(() => Boolean(form.id));
const canSave = computed(() => Boolean(form.departure.iata && form.arrival.iata && form.flightNumber && form.startDate));

watch(
  () => props.modelValue,
  (value) => {
    Object.assign(form, normalizeTripForm(value));
  },
  { immediate: true, deep: true }
);

function submit() {
  emit('submit', normalizeTripForm(form));
}

function resolveFlight() {
  emit('resolve', {
    flightNumber: form.flightNumber,
    startDate: form.startDate
  });
}

function normalizeTripForm(value = {}) {
  const fallback = emptyTrip();
  const source = value && typeof value === 'object' ? value : {};
  const departure = source.departure && typeof source.departure === 'object' ? source.departure : {};
  const arrival = source.arrival && typeof source.arrival === 'object' ? source.arrival : {};

  return {
    ...fallback,
    id: source.id,
    title: source.title || '',
    airline: source.airline || '',
    flightNumber: source.flightNumber || '',
    startDate: source.startDate || '',
    endDate: source.endDate || '',
    departureTime: source.departureTime || '',
    arrivalTime: source.arrivalTime || '',
    durationHours: Number(source.durationHours || 0),
    distanceKm: Number(source.distanceKm || 0),
    price: Number(source.price || 0),
    currency: source.currency || 'EUR',
    notes: source.notes || '',
    airlineCode: source.airlineCode || '',
    departureTimeUtc: source.departureTimeUtc || '',
    arrivalTimeUtc: source.arrivalTimeUtc || '',
    timezoneShiftHours: source.timezoneShiftHours === null || source.timezoneShiftHours === undefined ? null : Number(source.timezoneShiftHours),
    timezoneNote: source.timezoneNote || '',
    departure: {
      ...fallback.departure,
      airport: departure.airport || '',
      airportName: departure.airportName || '',
      iata: departure.iata || '',
      icao: departure.icao || '',
      city: departure.city || '',
      country: departure.country || '',
      lat: Number(departure.lat || 0),
      lng: Number(departure.lng || 0)
    },
    arrival: {
      ...fallback.arrival,
      airport: arrival.airport || '',
      airportName: arrival.airportName || '',
      iata: arrival.iata || '',
      icao: arrival.icao || '',
      city: arrival.city || '',
      country: arrival.country || '',
      lat: Number(arrival.lat || 0),
      lng: Number(arrival.lng || 0)
    }
  };
}
</script>

<template>
  <form class="card form-card" @submit.prevent="submit">
    <h2>{{ isEditing ? ui.t('form.editTitle') : ui.t('form.newTitle') }}</h2>

    <div class="form-grid">
      <div class="two-cols">
        <label class="field">
          <span>{{ ui.t('form.flightNumber') }}</span>
          <input v-model="form.flightNumber" required placeholder="AZ792" />
        </label>
        <label class="field">
          <span>{{ ui.t('form.flightDate') }}</span>
          <input v-model="form.startDate" required type="date" />
        </label>
      </div>

      <button class="button" type="button" :disabled="resolving" @click="resolveFlight">
        <RefreshCw :size="18" />
        {{ resolving ? ui.t('form.retrieving') : ui.t('form.retrieve') }}
      </button>

      <div v-if="resolveError" class="error">{{ resolveError }}</div>

      <section v-if="canSave" class="flight-summary">
        <div>
          <span>{{ ui.t('form.route') }}</span>
          <strong>{{ form.departure.airportName || form.departure.iata }} · {{ airportCityLabel(form.departure) }} - {{ form.arrival.airportName || form.arrival.iata }} · {{ airportCityLabel(form.arrival) }}</strong>
        </div>
        <div>
          <span>{{ ui.t('form.airline') }}</span>
          <strong>{{ airlineLabel(form.airline, form.airlineCode) }} <span v-if="form.airlineCode">({{ form.airlineCode }})</span></strong>
        </div>
        <div>
          <span>{{ ui.t('form.departure') }}</span>
          <strong>{{ form.departureTime || form.startDate }}</strong>
        </div>
        <div>
          <span>{{ ui.t('form.arrival') }}</span>
          <strong>{{ form.arrivalTime || form.endDate || 'n.d.' }}</strong>
        </div>
        <div>
          <span>{{ ui.t('form.duration') }}</span>
          <strong>{{ Number(form.durationHours || 0).toFixed(1) }} ore</strong>
        </div>
        <div>
          <span>{{ ui.t('form.distance') }}</span>
          <strong>{{ Number(form.distanceKm || 0).toLocaleString('it-IT') }} km</strong>
        </div>
        <div v-if="form.timezoneNote" class="flight-summary-wide">
          <span>{{ ui.t('form.timezone') }}</span>
          <strong>{{ form.timezoneNote }}</strong>
        </div>
      </section>

      <div class="two-cols">
        <label class="field">
          <span>{{ ui.t('form.price') }}</span>
          <input v-model.number="form.price" min="0" step="0.01" type="number" />
        </label>
        <label class="field">
          <span>{{ ui.t('form.currency') }}</span>
          <select v-model="form.currency">
            <option>EUR</option>
            <option>USD</option>
            <option>GBP</option>
            <option>JPY</option>
          </select>
        </label>
      </div>

      <label class="field">
        <span>{{ ui.t('form.notes') }}</span>
        <textarea v-model="form.notes" :placeholder="ui.locale === 'en' ? 'Seats, stopovers, memories, useful details' : 'Posti, scalo, ricordi, dettagli utili'"></textarea>
      </label>

      <div class="toolbar">
        <button class="button" type="submit" :disabled="saving || !canSave">
          <Save :size="18" />
          {{ saving ? ui.t('form.saving') : ui.t('form.save') }}
        </button>
        <button v-if="isEditing" class="ghost-button" type="button" @click="emit('cancel')">
          <X :size="18" />
          {{ ui.t('form.cancel') }}
        </button>
      </div>
    </div>
  </form>
</template>
