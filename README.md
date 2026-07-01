# TravelCheck

Dashboard full-stack per salvare, visualizzare e analizzare i propri viaggi aerei.

## Stack

- Frontend: Vue 3, Vite, Vue Router, Pinia, Leaflet/OpenStreetMap
- Backend: Node.js, Express, JWT, bcrypt
- Persistenza: file JSON locale in `server/src/data/travelcheck.json`
- Costi: solo librerie open-source e mappe OpenStreetMap

## Avvio locale

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4000

## Variabili ambiente

Copia `server/.env.example` in `server/.env`.

```bash
cp server/.env.example server/.env
```

Per recuperare i dati reali da numero volo e data, valorizza `AIRLABS_API_KEY` nel file `server/.env`.

Il backend usa AirLabs, che pubblica un free tier e copre bene il caso Flighty-like per numero volo, stato e orari. Ho aggiunto anche una cache in memoria sul resolver per ridurre le chiamate e stare più agevolmente nei limiti del piano free.

## Aeroporti reali

L'app include un fallback con aeroporti reali principali. Per scaricare il catalogo completo OurAirports in locale:

```bash
npm run sync:airports --workspace server
```

Il file viene salvato in `server/src/data/airports.csv` ed e ignorato da git.

## Funzionalita

- Registrazione e login con JWT
- Creazione, modifica ed eliminazione dei voli salvati
- Recupero dati volo da numero volo e data tramite provider configurato
- Ricerca aeroporti reali con codice IATA/ICAO
- Validazione lato server degli aeroporti selezionati
- Calcolo automatico della distanza tra partenza e arrivo
- Dashboard con card per singolo viaggio
- Pagina dettaglio viaggio
- Statistiche su ore totali, voli, nazioni, citta, aeroporti e distanza stimata
- Mappa dinamica con rotte e marker

## Hosting gratuito o free-tier

La struttura e pronta per:

- Frontend statico su Vercel o Netlify
- Backend Node su un provider con free tier compatibile con Express
- In produzione, sostituire la persistenza JSON con un database free-tier come Postgres/Supabase o SQLite persistente

Il backend locale usa file JSON per semplicita: su hosting serverless o con filesystem effimero i dati possono non essere persistenti.
