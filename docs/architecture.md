# TERRAWATCH Architecture

## Multi-Container Topology

```
                    ┌─────────────────────┐
                    │    Gateway (Nginx)   │
                    │      port 8080       │
                    └───┬──────────┬───────┘
                        │          │
              /api/*    │          │  /*
              /health   │          │
                        ▼          ▼
              ┌──────────┐  ┌──────────┐
              │   API    │  │   Web    │
              │ Express  │  │  Nginx   │
              │ port 3001│  │  port 80 │
              └────┬─────┘  └──────────┘
                   │
              ┌────▼─────┐
              │  SQLite   │
              │ /data vol │
              └──────────┘
```

### Services

| Service | Image | Port | Description |
|---|---|---|---|
| `api` | `apps/api/Dockerfile` | 3001 | Express.js API, cron jobs, ML pipeline, data ingest |
| `web` | `apps/web/Dockerfile` | 80 | Vite-built React SPA served by Nginx with SPA fallback |
| `gateway` | `infra/nginx/Dockerfile` | 8080 | Reverse proxy — routes `/api/` to API, `/` to Web |

### Volumes

| Volume | Mount | Purpose |
|---|---|---|
| `terrawatch-data` | `/data` | Persistent SQLite database (`terrawatch.db`) |

### Running with Docker Compose

```bash
cd infra
docker compose up --build
```

The application will be available at `http://localhost:8080`.

### Cloud Run (Single Image)

For simple staging deployments, `infra/cloudrun/single-image.Dockerfile` builds both
the Vite frontend and the Express API into a single container. Express serves the
static frontend from `dist/` and handles `/api/` routes on port 8080.

```bash
docker build -f infra/cloudrun/single-image.Dockerfile -t terrawatch .
docker run -p 8080:8080 -v terrawatch-data:/data terrawatch
```

## Backend Organization

```
apps/api/src/
├── index.js                    # Entry point — cron jobs, boot sequence
├── app.js                      # createApp() — Express app construction
├── config/env.js               # Centralized environment variable reads
├── middleware/                  # CORS, rate limiting, JSON body parsing
├── products/
│   ├── core/
│   │   ├── routes/             # 12 route modules (waterQuality, habOracle, weather, etc.)
│   │   └── services/
│   │       ├── ingest/         # 14 data source fetchers (USGS, NOAA, NERRS, EPA, etc.)
│   │       └── features/       # crossSensor, mlTrainer, metricsAggregator
│   ├── sitevault/              # Industrial site intelligence (placeholder)
│   └── wetlandai/              # Wetland pre-delineation (placeholder)
├── data/
│   ├── database.js             # SQLite via sql.js (WASM, no native deps)
│   └── sources/                # Data source definitions and polling configs
├── ml/
│   ├── shared/featureVector.js # Re-exports from @terrawatch/shared
│   ├── phase1-logreg/          # habOracle.js — 11-factor weighted ensemble
│   ├── phase2-rf-shap/         # randomForest.js + shap.js (active at 100+ labeled)
│   └── phase3-deep/            # CNN-LSTM, ST-GNN, ST-Transformer, PI-RNN (pre-wired)
└── jobs/                       # dataSourcePoller.js — EventEmitter-based polling
```

## ML Phase Progression

```
Phase 0  (always)           Accumulate labeled samples via auto-labeling engine
Phase 1  (active)           Logistic regression, 152-key vector, JS — always-on
Phase 2  (≥100 labeled)     Random Forest ensemble + Permutation SHAP, JS
Phase 3  (≥2000 labeled)    CNN-LSTM on Vertex AI (pre-wired)
Phase 3+ (future)           ST-Transformer, Spatio-Temporal GNN, PI-RNN
```

### 152-Key Feature Vector

The ML feature vector is defined once in `packages/shared/src/featureVector.js` and
re-exported by `@terrawatch/shared`. All consumers (API, frontend) import from this
single source of truth.

Feature domains:
- **Water quality** (21 keys): USGS DO, temp, flow, turbidity, nutrients
- **Estuarine** (17 keys): NERRS Weeks Bay — DO, salinity, chlorophyll, PAR, met
- **Currents** (3 keys): HF Radar speed, direction, bloom transport
- **Tidal/CO-OPS** (6 keys): Dauphin Island water level, salinity, wind, pressure
- **GOES-19** (15 keys): SST, QPE rainfall, GLM lightning, bloom/turbidity indices
- **Buoy** (12 keys): NDBC 42012 — waves, wind, pressure, temperature
- **NWS** (9 keys): Forecast wind, temp, humidity, visibility
- **Satellite** (8 keys): MODIS/VIIRS/HLS/Landsat/Sentinel-2 granule counts
- **Ocean models** (3 keys): CMEMS, HYCOM, CoastWatch availability
- **Ecology** (4 keys): iNaturalist, GBIF, eBird, AmeriFlux
- **Meteorology** (13 keys): Open-Meteo precip, CAPE, UV, solar, soil moisture
- **Land/flood** (5 keys): AHPS stage, FEMA zone, NLCD impervious
- **Air quality** (4 keys): OpenAQ, PurpleAir, EPA AQS PM2.5
- **Derived** (10 keys): HAB prob, tidal phase, halocline, trends, compound stress
- **Temporal** (7 keys): Month, summer flag, night flag, hour/DOY sin-cos
- **Extended poller** (10 keys): ERDDAP chl, HAB bulletin, EPA ECHO, vessel traffic

## Cron Architecture

| Tier | Interval | Sources |
|---|---|---|
| Fast | 3 min | USGS, CO-OPS, NERRS, HF Radar, AirNow, GOES DB, NDBC, NWS |
| Mid | 20 min | Satellite (CMR), Ocean (HYCOM/CMEMS), Ecology, AirPlus, WQP |
| Slow | 6 hr | Land-Reg, AHPS, NCEI, SSURGO, FEMA |
| Nightly | 8 AM | ML retrain (Random Forest + SHAP) |
| Poller | Per-source | 9 additional sources via EventEmitter (USGS+, PORTS, NWS, ERDDAP, EPA, GCOOS, HAB, AIS, USACE) |

## Shared Package

`@terrawatch/shared` (`packages/shared/`) exports:
- `FEATURE_KEYS` — ordered array of 152 feature key names
- `FEATURE_DEFAULTS` — object with all keys initialized to 0
