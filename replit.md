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
- **Nightly cron (8AM)**: ML retrain (Random Forest + SHAP explainability)
- **ML feature vector**: 142 features from 15+ live data sources per tick
- **HAB Oracle v2.2**: 11-factor weighted ensemble (6 legacy + 4 GOES-19 factors + PAR bloom growth risk)
- **Hypoxia Forecast**: Halocline-based stratification model with Jubilee detection conditions
- **Alert Engine**: evaluateAndDispatchAlerts() — hypoxia, stratification, bloom, compound stress, flood, air quality

## GOES-19 Dual-Track Architecture

- **Push pipeline**: `routes/goes19.js` → SQLite DB → `getLatestGOESReadings()` → `_latestData.goesLatest` → ML model + frontend
- **ERDDAP pull**: `services/goes.js` → CoastWatch ERDDAP (currently 404, fallback to push)
- **Frontend merge**: `/api/sensors/goes/all` returns `status` (ERDDAP), `imagery` (CDN), and `push` (DB) fields
- **Push fields**: sst_mean, sst_gradient, qpe_rainfall, qpe_6h, qpe_24h, cloud_coverage, glm_flashes, glm_active, amv_wind_speed, amv_wind_dir, bloom_index, turbidity_idx

## Project Structure

```
terrawatch/
├── src/                        # React frontend
│   ├── pages/                  # 20 page components
│   │   ├── Dashboard.jsx       # Main environmental dashboard (GOES alert strip, UV/gust/PM2.5 cards)
│   │   ├── HabOracle.jsx       # HAB prediction (World First™)
│   │   ├── HypoxiaForecast.jsx # Hypoxia risk forecasting with Jubilee detection
│   │   ├── WaterQuality.jsx    # Interactive water quality map
│   │   ├── SensorsRegistry.jsx # Data feed registry
│   │   ├── CompoundFlood.jsx   # Compound flood intelligence (AHPS + GOES QPE + USGS flow)
│   │   ├── BeachSafety.jsx     # Beach safety (swim index, ADPH closures, UV, currents)
│   │   ├── ClimateVulnerability.jsx # Climate vulnerability index (SST, DO₂, heat index)
│   │   ├── PollutionTracker.jsx # Pollution tracker (AQI, PM2.5, turbidity, nutrients)
│   │   ├── WetlandAI.jsx       # Wetland pre-delineation
│   │   ├── SITEVAULT.jsx       # Site assessment vault
│   │   ├── MapPage.jsx         # Satellite map view (4 live overlay layers)
│   │   ├── DataStream.jsx      # 142-key feature vector explorer (9 tabs)
│   │   ├── ScienceView.jsx     # Science data explorer
│   │   ├── FeedStatus.jsx      # Live feed status dashboard
│   │   ├── Intelligence.jsx    # ML intelligence dashboard
│   │   ├── Alerts.jsx          # Alert center
│   │   ├── AIAssistant.jsx     # AI field assistant
│   │   ├── Vision.jsx          # Platform vision
│   │   └── MLArchitecture.jsx  # ML architecture docs
│   ├── components/
│   │   ├── Common/index.jsx    # StatCard (glass, risk tints, sparklines, freshness), PageHeader, RiskBadge, Spinner, SkeletonCard, SkeletonRow, Section, EmptyState, AlertBanner
│   │   ├── Charts/index.jsx    # DOChart, HABProbabilityChart, WeatherForecastChart, AirQualityChart, SatelliteTimelineChart, OceanConditionsChart
│   │   └── Layout/Layout.jsx   # Sidebar navigation (22 routes, "142 KEYS" DataStream badge, 4 NEW product badges)
│   ├── store/index.js          # Zustand store (all API fetchers including flood/beach/climate/pollution/inference/sourceHealth/ADPH)
│   ├── App.jsx                 # Router with nested Layout routes (20 pages)
│   ├── main.jsx                # React entry point
│   └── index.css               # Tailwind + custom classes
├── server/                     # Express API
│   ├── index.js                # Server entry (port 3001, trust proxy, alert engine, nightly retrain cron)
│   ├── routes/
│   │   ├── waterQuality.js     # /api/water/*
│   │   ├── habOracle.js        # /api/hab/*
│   │   ├── weather.js          # /api/weather/*
│   │   ├── alerts.js           # /api/alerts
│   │   ├── sensors.js          # /api/sensors/*
│   │   ├── goes19.js           # /api/goes19/*
│   │   ├── ai.js               # /api/ai/*
│   │   ├── intelligence.js     # /api/intelligence/* (feature-keys, export-csv, explain/SHAP, source-health)
│   │   ├── mlArchitecture.js   # /api/ml/*
│   │   ├── flood.js            # /api/flood/status (compound flood risk)
│   │   ├── beach.js            # /api/beach/status (swim safety + ADPH closures)
│   │   ├── climate.js          # /api/climate/status (vulnerability index)
│   │   └── pollution.js        # /api/pollution/status (pollution index)
│   ├── services/
│   │   ├── usgs.js             # USGS NWIS water data (6 stations, gage_height, orthophosphate, total_nitrogen)
│   │   ├── noaa.js             # NOAA CO-OPS, NWS, NDBC
│   │   ├── hfradar.js          # NOAA ERDDAP surface currents (3-endpoint fallback: 6km → 1km → THREDDS)
│   │   ├── nerrs.js            # Weeks Bay CDMO dock sensors (primary wekbwq + secondary wekbwq2)
│   │   ├── pace.js             # NASA PACE OCI ocean color
│   │   ├── tropomi.js          # Sentinel-5P CH4 methane
│   │   ├── epa.js              # EPA ECHO/WQP/AirNow/TRI
│   │   ├── openeo.js           # Copernicus Algorithm Plaza (8 algorithms)
│   │   ├── adph.js             # Alabama Dept Public Health shellfish closures
│   │   ├── database.js         # SQLite persistence (sql.js, writeSourceHealth, getSourceHealthSummary)
│   │   ├── crossSensor.js      # Cross-sensor feature assembly (142 keys) + corrected autoLabel (K. brevis ecology: warm+salty+calm+highChl+summer)
│   │   ├── mlTrainer.js        # ML training pipeline (Phase 1-3, Random Forest, SHAP, exportVectorsCSV)
│   │   ├── satellite.js        # MODIS, VIIRS, HLS, Landsat, Sentinel-2, Copernicus DEM
│   │   ├── ocean.js            # CMEMS, HYCOM, CoastWatch, StreamStats, Digital Coast
│   │   ├── ecology.js          # iNaturalist, GBIF, eBird, AmeriFlux
│   │   ├── landregweather.js   # Open-Meteo (fixed hour index), AHPS (XML stage parse), NCEI, SSURGO, NWI, FEMA, NLCD, ATTAINS, USACE
│   │   ├── airplus.js          # EPA AQS, OpenAQ, PurpleAir
│   │   └── goes.js             # GOES-19 ABI SST (CoastWatch ERDDAP) + imagery (NOAA STAR CDN)
│   └── ml/
│       ├── habOracle.js        # HAB Oracle algorithm (11 factors, PAR bloom growth, halocline hypoxia model, Jubilee detection)
│       ├── randomForest.js     # Phase 2 Random Forest ensemble
│       ├── shap.js             # Permutation SHAP explainability
│       ├── stfGnn.js           # Spatio-temporal GNN (Phase 3 pre-wire)
│       ├── stTransformer.js    # Spatio-temporal Transformer (Phase 3 pre-wire)
│       └── piRnn.js            # Physics-informed RNN (Phase 3 pre-wire)
├── vite.config.js              # Vite (port 5000, proxy /api → :3001)
├── tailwind.config.js          # Bay palette (light greens)
└── package.json                # Monorepo scripts
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
