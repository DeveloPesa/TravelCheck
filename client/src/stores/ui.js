import { defineStore } from 'pinia';

const messages = {
  it: {
    app: { title: 'TravelCheck' },
    nav: { trips: 'Viaggi', stats: 'Statistiche', logout: 'Esci' },
    theme: { dark: 'Scuro', light: 'Chiaro' },
    language: { it: 'IT', en: 'EN' },
    dashboard: {
      title: 'I tuoi viaggi',
      subtitle: 'Gestisci voli, aeroporti, rotte e dettagli personali in una dashboard unica.',
      new: 'Nuovo',
      loading: 'Caricamento viaggi...',
      empty: 'Aggiungi il primo volo per popolare dashboard, statistiche e mappa.'
    },
    form: {
      newTitle: 'Nuovo viaggio',
      editTitle: 'Modifica viaggio',
      flightNumber: 'Numero volo',
      flightDate: 'Data volo',
      retrieve: 'Recupera dati volo',
      retrieving: 'Recupero dati',
      price: 'Prezzo',
      currency: 'Valuta',
      notes: 'Note',
      save: 'Salva',
      saving: 'Salvataggio',
      cancel: 'Annulla',
      route: 'Rotta',
      airline: 'Compagnia',
      departure: 'Partenza',
      arrival: 'Arrivo',
      duration: 'Durata',
      distance: 'Distanza',
      timezone: 'Fuso orario'
    },
    stats: {
      title: 'Statistiche',
      subtitle: 'Una lettura complessiva di ore in volo, rotte, citta, stati visitati e chilometri percorsi.',
      flights: 'Voli',
      hours: 'Ore',
      states: 'Stati',
      cities: 'Citta',
      atlasEyebrow: 'Atlante di viaggio',
      atlasTitle: 'Rotte e stati visitati',
      atlasLead: 'La mappa resta viva qui a lato, mentre i luoghi visitati emergono nel pannello di viaggio e nelle liste.',
      visitedStates: 'Stati visitati',
      visitedCities: 'Citta',
      airports: 'Aeroporti',
      timezones: 'Fusi orari'
    },
    detail: {
      back: 'Indietro',
      edit: 'Modifica',
      details: 'Dettagli',
      route: 'Rotta',
      notes: 'Note',
      totals: 'ore totali',
      spend: 'spesa',
      notFound: 'Viaggio non trovato.'
    },
    auth: {
      title: 'TravelCheck',
      loginSubtitle: 'Accedi al tuo archivio personale di voli, rotte e statistiche.',
      recoverSubtitle: 'Recupera l\'accesso in due passaggi: richiedi un token e poi imposta una nuova password.',
      registerSubtitle: 'Crea il tuo archivio personale di voli, rotte e statistiche.',
      name: 'Nome',
      email: 'Email',
      password: 'Password',
      token: 'Token',
      newPassword: 'Nuova password',
      login: 'Accedi',
      createAccount: 'Crea account',
      haveAccount: 'Ho gia un account',
      createAnAccount: 'Crea un account',
      recover: 'Recupera password',
      backLogin: 'Torna al login',
      generateToken: 'Genera token',
      updatePassword: 'Aggiorna password'
    },
    common: {
      theme: 'Tema',
      language: 'Lingua',
      details: 'Dettaglio',
      airports: 'Aeroporti',
      cities: 'Citta',
      countries: 'Stati'
    }
  },
  en: {
    app: { title: 'TravelCheck' },
    nav: { trips: 'Trips', stats: 'Stats', logout: 'Logout' },
    theme: { dark: 'Dark', light: 'Light' },
    language: { it: 'IT', en: 'EN' },
    dashboard: {
      title: 'Your trips',
      subtitle: 'Manage flights, airports, routes and personal details in one dashboard.',
      new: 'New',
      loading: 'Loading trips...',
      empty: 'Add your first flight to populate the dashboard, stats and map.'
    },
    form: {
      newTitle: 'New trip',
      editTitle: 'Edit trip',
      flightNumber: 'Flight number',
      flightDate: 'Flight date',
      retrieve: 'Fetch flight data',
      retrieving: 'Fetching data',
      price: 'Price',
      currency: 'Currency',
      notes: 'Notes',
      save: 'Save',
      saving: 'Saving',
      cancel: 'Cancel',
      route: 'Route',
      airline: 'Airline',
      departure: 'Departure',
      arrival: 'Arrival',
      duration: 'Duration',
      distance: 'Distance',
      timezone: 'Time zone'
    },
    stats: {
      title: 'Statistics',
      subtitle: 'A concise overview of flight hours, routes, visited cities, states and distance traveled.',
      flights: 'Flights',
      hours: 'Hours',
      states: 'States',
      cities: 'Cities',
      atlasEyebrow: 'Travel atlas',
      atlasTitle: 'Routes and visited states',
      atlasLead: 'The map stays active on the left, while the visited places show up in the journey panel and lists.',
      visitedStates: 'Visited states',
      visitedCities: 'Cities',
      airports: 'Airports',
      timezones: 'Time zones'
    },
    detail: {
      back: 'Back',
      edit: 'Edit',
      details: 'Details',
      route: 'Route',
      notes: 'Notes',
      totals: 'total hours',
      spend: 'spend',
      notFound: 'Trip not found.'
    },
    auth: {
      title: 'TravelCheck',
      loginSubtitle: 'Log in to your personal archive of flights, routes and stats.',
      recoverSubtitle: 'Recover access in two steps: request a token, then set a new password.',
      registerSubtitle: 'Create your personal archive of flights, routes and stats.',
      name: 'Name',
      email: 'Email',
      password: 'Password',
      token: 'Token',
      newPassword: 'New password',
      login: 'Log in',
      createAccount: 'Create account',
      haveAccount: 'I already have an account',
      createAnAccount: 'Create an account',
      recover: 'Recover password',
      backLogin: 'Back to login',
      generateToken: 'Generate token',
      updatePassword: 'Update password'
    },
    common: {
      theme: 'Theme',
      language: 'Language',
      details: 'Details',
      airports: 'Airports',
      cities: 'Cities',
      countries: 'States'
    }
  }
};

function readStored(key, fallback) {
  if (typeof localStorage === 'undefined') {
    return fallback;
  }

  return localStorage.getItem(key) || fallback;
}

function writeStored(key, value) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(key, value);
}

function resolveMessage(locale, path) {
  const dictionary = messages[locale] || messages.it;
  return path.split('.').reduce((value, part) => value?.[part], dictionary);
}

export const useUiStore = defineStore('ui', {
  state: () => ({
    theme: readStored('travelcheck_theme', 'dark'),
    locale: readStored('travelcheck_locale', 'it')
  }),
  actions: {
    setTheme(theme) {
      this.theme = theme === 'light' ? 'light' : 'dark';
      writeStored('travelcheck_theme', this.theme);
    },
    toggleTheme() {
      this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
    },
    setLocale(locale) {
      this.locale = locale === 'en' ? 'en' : 'it';
      writeStored('travelcheck_locale', this.locale);
    },
    t(path) {
      return resolveMessage(this.locale, path) || resolveMessage('it', path) || path;
    }
  }
});