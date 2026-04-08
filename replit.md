# TERRAWATCH v2.2

Planetary Environmental Intelligence Platform — Mobile Bay & Gulf Coast

## Architecture

- **Frontend**: React 18 + Vite (port 5000, host 0.0.0.0)
- **Backend**: Express.js API (port 3001, localhost)
- **Package manager**: npm
- **Runtime**: Node.js 20
- **State management**: Zustand
- **Database**: SQLite via sql.js (pure JS, `data/terrawatch.db`)
- **ML Pipeline**: Logistic regression (Phase 1) → Random Forest + SHAP (Phase 2) → CNN-LSTM on Vertex AI (Phase 3)
- **Styling**: Tailwind CSS (glassmorphism theme — frosted glass cards, gradient bg, risk tints)
- **Icons**: Lucide React (sidebar navigation)
- **Charts**: Recharts (includes inline sparklines in StatCards)
- **Maps**: Leaflet

## Server v2.2 Tiered Cron Architecture

- **Fast cron (3min)**: USGS, CO-OPS, NERRS, HF Radar, AirNow, GOES-19 DB lookup, NDBC Buoy 42012, NWS Weather
- **Slow cron (15min)**: Satellite (NASA CMR), Ocean models (HYCOM/CMEMS), Ecology (iNaturalist/GBIF/eBird), Land/Weather (Open-Meteo/AHPS), Air Quality (EPA AQS/OpenAQ/PurpleAir)
- **Data Source Poller**: EventEmitter-based per-source polling — USGS Extended (15min), NOAA PORTS (6min), NWS Point Forecast (60min), ERDDAP Ocean Color (720min), EPA ECHO (1440min), GCOOS Buoys (30min), HAB Bulletin (360min), AIS Vessel Traffic (15min), USACE Dredge (1440min)
- **Nightly cron (8AM)**: ML retrain (Random Forest + SHAP explainability)
- **ML feature vector**: 152 features from 24+ live data sources per tick (10 new: erddap_chl_mean, erddap_chl_p90, erddap_sst_mean, hab_bulletin_events_nearby, epa_echo_exceedances, upstream_total_flow_kcfs_extended, vessel_count_in_bay, dredge_active_flag, gcoos_water_temp_offshore, nws_precip_chance_24h)
- **HAB Oracle v2.2**: 11-factor weighted ensemble (6 legacy + 4 GOES-19 factors + PAR bloom growth risk)
- **Hypoxia Forecast**: Halocline-based stratification model with Jubilee detection conditions
- **Alert Engine**: evaluateAndDispatchAlerts() — hypoxia, stratification, bloom, compound stress, flood, air quality

## Public Metrics API (terrawatch.io integration)

- **Route**: `GET /api/metrics` — All 7 card metrics (5-min cached JSON)
- **Route**: `GET /api/metrics/:id` — Single metric by ID
- **Route**: `GET /api/metrics/stream` — SSE push every 5min
- **Cache invalidation**: Automatic on poller snapshot events
- **CORS**: Allows `terrawatch.io`, `www.terrawatch.io`, `localhost:3000/5173/5000`
- **Metric IDs**: `hab_oracle`, `hypoxia_forecast`, `jubilee_predictor`, `water_quality`, `compound_flood`, `beach_safety`, `pollution_tracker`
- **Files**: `server/services/metricsAggregator.js` (computes from DB snapshots), `server/routes/metrics.js` (Express router)
- **Frontend embed**: `attached_assets/terrawatch-metrics-patch_*/frontend/terrawatch-metrics.js` — drop into Framer custom code, set `API_BASE` to deployed URL

## GOES-19 Dual-Track Architecture

- **Push pipeline**: `routes/goes19.js` → SQLite DB → `getLatestGOESReadings()` → `_latestData.goesLatest` → ML model + frontend
- **ERDDAP pull**: `services/goes.js` → CoastWatch ERDDAP (currently 404, fallback to push)
- **Frontend merge**: `/api/sensors/goes/all` returns `status` (ERDDAP), `imagery` (CDN), and `push` (DB) fields
- **Push fields**: sst_mean, sst_gradient, qpe_rainfall, qpe_6h, qpe_24h, cloud_coverage, glm_flashes, glm_active, amv_wind_speed, amv_wind_dir, bloom_index, turbidity_idx

## Project Structure (Monorepo)

```
terrawatch/
├── apps/
│   └── web/                        # @terrawatch/web — React frontend
│       ├── src/
│       │   ├── pages/
│       │   │   ├── core/           # Dashboard, HabOracle, HypoxiaForecast, WaterQuality,
│       │   │   │                   # BeachSafety, CompoundFlood, ClimateVulnerability,
│       │   │   │                   # PollutionTracker, Intelligence, MapPage, ScienceView,
│       │   │   │                   # Alerts, AIAssistant
│       │   │   ├── sitevault/      # SITEVAULT.jsx
│       │   │   ├── wetlandai/      # WetlandAI.jsx
│       │   │   └── platform/       # SensorsRegistry, DataSources, DataStream, FeedStatus,
│       │   │                       # MLArchitecture, MasterRoadmap, Vision
│       │   ├── components/
│       │   │   ├── common/         # StatCard, PageHeader, RiskBadge, Spinner, etc.
│       │   │   ├── charts/         # DOChart, HABProbabilityChart, etc.
│       │   │   └── layout/         # Sidebar navigation Layout
│       │   ├── store/index.js      # Zustand store
│       │   ├── App.jsx             # Router (23 routes)
│       │   ├── main.jsx            # React entry point
│       │   └── index.css           # Tailwind + custom classes
│       ├── index.html
│       ├── vite.config.js          # Vite (port 5000, proxy /api → :3001)
│       ├── tailwind.config.js      # Bay palette
│       └── package.json
├── server/                         # Express API (moves to apps/api in Task #15)
│   ├── index.js
│   ├── routes/
│   ├── services/
│   ├── ml/
│   └── jobs/
├── packages/
│   └── shared/                     # @terrawatch/shared (populated in Task #15)
├── _legacy/                        # Quarantined vestigial files (safe to ignore)
│   ├── root-cleanup/               # 44 loose root files that were not part of live app
│   └── dist-snapshot/              # Old build output
├── infra/                          # Docker + nginx (populated in Task #16)
├── docs/                           # Documentation (populated in Task #16)
└── package.json                    # Workspace root (npm workspaces)
```

## Running

```bash
npm run dev           # Starts both frontend (5000) and backend (3001) with concurrently
npm run dev:client    # Frontend only
npm run dev:server    # Backend only
npm run build         # Vite production build
```

## Data Sources (51 total — 38+ active, key-required varies by env, 5 planned, 2 partnership)

### Tier 1 — No Keys Required (28 sources)
- USGS NWIS — water quality and streamflow (6 stations)
- NOAA CO-OPS — tidal data and water levels
- NOAA NWS — weather forecasts and alerts
- NOAA NDBC — offshore buoy data (Buoy 42012)
- NOAA HF Radar — ERDDAP surface currents (3-endpoint fallback)
- NERRS CDMO — Weeks Bay dock sensors (primary + secondary station wekbwq)
- EPA ECHO — facility compliance data
- EPA Water Quality Portal — federal water quality
- EPA TRI — toxic release inventory
- GOES-19 ABI — geostationary SST + imagery (NOAA STAR CDN, no key)
- Copernicus DEM GLO-30 — 30m global elevation
- HYCOM Ocean Model — 3D currents, temp, salinity
- NOAA CoastWatch ERDDAP — SST, chlorophyll, SSH
- USGS StreamStats — watershed delineation
- NOAA Digital Coast — coastal elevation, lidar
- iNaturalist — citizen science biodiversity
- GBIF — global biodiversity occurrences
- Open-Meteo — 7-day weather forecast (no key)
- NOAA AHPS — flood stage data (XML stage extraction)
- NRCS SSURGO — hydric soil survey
- USGS NWI — National Wetlands Inventory
- FEMA FIRM — flood zone maps
- NLCD 2021 — land cover classification
- EPA ATTAINS — impaired waters 303(d)
- USACE ORM — Section 404 permits
- OpenAQ — global air quality aggregator
- ADPH — Alabama shellfish closure monitoring

### Tier 2 — Free Keys (Optional, 10 sources)
- `NASA_EARTHDATA_USER` / `NASA_EARTHDATA_PASS` — PACE OCI, MODIS, VIIRS, HLS, Landsat (6 sources)
- `COPERNICUS_USER` / `COPERNICUS_PASS` — Sentinel-2, TROPOMI, CMEMS ocean (3 sources)
- `AIRNOW_API_KEY` — EPA AirNow AQI data
- `EBIRD_API_KEY` — eBird Cornell Lab bird observations
- `AQS_EMAIL` / `AQS_API_KEY` — EPA AQS official monitors
- `NCEI_API_KEY` — NOAA NCEI historical climate
- `PURPLEAIR_API_KEY` — PurpleAir PM2.5 network
- `AMERIFLUX_TOKEN` — CO₂/CH₄ flux tower data

### Tier 3 — Premium (Optional)
- `ANTHROPIC_API_KEY` — AI Field Assistant
- `VEXCEL_API_KEY` — High-res aerial imagery

## Product Intelligence Pages (v2.2)

### Compound Flood (`/compound-flood`)
- AHPS flood stage + GOES QPE rainfall + USGS river flow + Open-Meteo 7-day precipitation
- Compound risk scoring (0-100) based on multiple concurrent flood drivers

### Beach Safety (`/beach-safety`)
- Swim safety index (0-100) based on waves, wind, currents, UV, AQI
- ADPH shellfish closure monitoring
- NDBC buoy conditions + HF Radar currents

### Climate Vulnerability (`/climate`)
- Vulnerability index based on SST, DO₂, heat index, sea level
- GOES-19 SST gradient analysis
- Trend accumulation for long-term analysis

### Pollution Tracker (`/pollution`)
- Multi-source PM2.5 (OpenAQ + PurpleAir + EPA AQS)
- Water turbidity + nutrient loading (orthophosphate, total nitrogen)
- NPDES compliance monitoring

## ML Pipeline v2.2

- **142-key feature vector**: Assembled from 15+ live data sources every 3 minutes
- **Auto-labeling**: Corrected K. brevis ecology signals (warm+salty+calm+highChl+summer ≥ 3 = HAB positive)
- **Phase 1**: Logistic regression (always active)
- **Phase 2**: Random Forest ensemble + Permutation SHAP explainability (≥100 labeled samples)
- **Phase 3**: CNN-LSTM on Vertex AI (≥2000 labeled samples, requires GCP credentials)
- **SHAP endpoint**: POST /api/intelligence/explain — returns feature importance values
- **CSV export**: GET /api/intelligence/export-csv — download training vectors
- **Source health**: GET /api/intelligence/source-health — data source uptime monitoring
