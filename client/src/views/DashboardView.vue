<script setup>
import { onMounted, ref, toRaw, watch } from 'vue';
import { Plus } from '@lucide/vue';
import { useRoute, useRouter } from 'vue-router';
import TripCard from '../components/TripCard.vue';
import TripForm from '../components/TripForm.vue';
import { emptyTrip, useTripsStore } from '../stores/trips';
import { useUiStore } from '../stores/ui';

const trips = useTripsStore();
const ui = useUiStore();
const route = useRoute();
const router = useRouter();
const selectedTrip = ref(emptyTrip());
const saving = ref(false);
const resolving = ref(false);
const resolveError = ref('');

onMounted(() => {
  trips.fetchTrips();
});

watch(
  () => [trips.trips, route.query.edit],
  () => syncTripFromQuery(),
  { deep: true, immediate: true }
);

function syncTripFromQuery() {
  const editId = route.query.edit;

  if (!editId) {
    return;
  }

  const trip = trips.trips.find((item) => item.id === editId);

  if (trip) {
    selectedTrip.value = cloneTrip(trip);
  }
}

async function saveTrip(payload) {
  saving.value = true;

  try {
    await trips.saveTrip(payload);
    selectedTrip.value = emptyTrip();
    await router.replace({ name: 'dashboard' });
  } finally {
    saving.value = false;
  }
}

async function resolveFlight(payload) {
  resolving.value = true;
  resolveError.value = '';

  try {
    const resolved = await trips.resolveFlight(payload.flightNumber, payload.startDate);
    selectedTrip.value = {
      ...selectedTrip.value,
      ...resolved,
      price: selectedTrip.value.price,
      currency: selectedTrip.value.currency,
      notes: selectedTrip.value.notes
    };
  } catch (error) {
    resolveError.value = error.message;
  } finally {
    resolving.value = false;
  }
}

function editTrip(trip) {
  selectedTrip.value = cloneTrip(trip);
  router.replace({ name: 'dashboard', query: { edit: trip.id } });
}

function cancelEdit() {
  selectedTrip.value = emptyTrip();
  router.replace({ name: 'dashboard' });
}

function startNewTrip() {
  cancelEdit();
}

function cloneTrip(trip) {
  return JSON.parse(JSON.stringify(toRaw(trip)));
}

async function deleteTrip(id) {
  if (confirm('Eliminare questo viaggio?')) {
    await trips.removeTrip(id);
  }
}
</script>

<template>
  <section>
    <header class="page-header">
      <div>
        <h1>{{ ui.t('dashboard.title') }}</h1>
        <p>{{ ui.t('dashboard.subtitle') }}</p>
      </div>
      <button class="button" type="button" @click="startNewTrip">
        <Plus :size="18" />
        {{ ui.t('dashboard.new') }}
      </button>
    </header>

    <div v-if="trips.error" class="error">{{ trips.error }}</div>

    <div class="grid dashboard-grid">
      <TripForm
        :model-value="selectedTrip"
        :resolve-error="resolveError"
        :resolving="resolving"
        :saving="saving"
        @resolve="resolveFlight"
        @submit="saveTrip"
        @cancel="cancelEdit"
      />

      <div>
        <div v-if="trips.loading" class="empty-state">{{ ui.t('dashboard.loading') }}</div>
        <div v-else-if="!trips.trips.length" class="empty-state">{{ ui.t('dashboard.empty') }}</div>
        <div v-else class="trip-list">
          <TripCard v-for="trip in trips.trips" :key="trip.id" :trip="trip" @edit="editTrip" @delete="deleteTrip" />
        </div>
      </div>
    </div>
  </section>
</template>
