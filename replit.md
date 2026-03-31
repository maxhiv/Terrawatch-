# TERRAWATCH v2.0

Planetary Environmental Intelligence Platform — Mobile Bay & Gulf Coast

## Architecture

- **Frontend**: React 18 + Vite (port 5000, host 0.0.0.0)
- **Backend**: Express.js API (port 3001, localhost)
- **Package manager**: npm
- **Runtime**: Node.js 20
- **State management**: Zustand
- **Database**: SQLite via sql.js (pure JS, `data/terrawatch.db`)
- **ML Pipeline**: Logistic regression (Phase 1) → Random Forest (Phase 2) → CNN-LSTM on Vertex AI (Phase 3)
- **Styling**: Tailwind CSS (glassmorphism theme — frosted glass cards, gradient bg, risk tints)
- **Icons**: Lucide React (sidebar navigation)
- **Charts**: Recharts (includes inline sparklines in StatCards)
- **Maps**: Leaflet

## Project Structure

```
terrawatch/
├── src/                        # React frontend
│   ├── pages/                  # 14 page components
│   │   ├── Dashboard.jsx       # Main environmental dashboard
│   │   ├── HabOracle.jsx       # HAB prediction (World First™)
│   │   ├── HypoxiaForecast.jsx # Hypoxia risk forecasting
│   │   ├── WaterQuality.jsx    # Interactive water quality map
│   │   ├── SensorsRegistry.jsx # Data feed registry
│   │   ├── WetlandAI.jsx       # Wetland pre-delineation
│   │   ├── SITEVAULT.jsx       # Site assessment vault
│   │   ├── MapPage.jsx         # Satellite map view
│   │   ├── ScienceView.jsx     # Science data explorer
│   │   ├── FeedStatus.jsx      # Live feed status dashboard
│   │   ├── Alerts.jsx          # Alert center
│   │   ├── AIAssistant.jsx     # AI field assistant
│   │   ├── Vision.jsx          # Platform vision
│   │   └── MLArchitecture.jsx  # ML architecture docs
│   ├── components/
│   │   ├── Common/index.jsx    # StatCard (glass, risk tints, sparklines, freshness), PageHeader, RiskBadge, Spinner, SkeletonCard, SkeletonRow, Section, EmptyState, AlertBanner
│   │   ├── Charts/index.jsx    # DOChart, HABProbabilityChart, WeatherForecastChart, AirQualityChart, SatelliteTimelineChart, OceanConditionsChart
│   │   └── Layout/Layout.jsx   # Sidebar navigation (16 routes)
│   ├── store/index.js          # Zustand store (all API fetchers)
│   ├── App.jsx                 # Router with nested Layout routes
│   ├── main.jsx                # React entry point
│   └── index.css               # Tailwind + custom classes (tw-badge, tw-btn-primary, live-dot, animate-in)
├── server/                     # Express API
│   ├── index.js                # Server entry (port 3001, trust proxy)
│   ├── routes/
│   │   ├── waterQuality.js     # /api/water/* (USGS, CO-OPS, NDBC)
│   │   ├── habOracle.js        # /api/hab/* (HAB assessment)
│   │   ├── weather.js          # /api/weather/* (NWS forecast)
│   │   ├── alerts.js           # /api/alerts (weather alerts)
│   │   ├── sensors.js          # /api/sensors/* (registry + hfradar, nerrs, pace, methane, epa, openeo)
│   │   ├── ai.js               # /api/ai/* (Anthropic assistant)
│   │   ├── intelligence.js     # /api/intelligence/* (DB stats, retrain, inference, vectors, events)
│   │   └── mlArchitecture.js   # /api/ml/* (ML architecture status)
│   ├── services/
│   │   ├── usgs.js             # USGS NWIS water data
│   │   ├── noaa.js             # NOAA CO-OPS, NWS, NDBC
│   │   ├── hfradar.js          # NOAA ERDDAP surface currents
│   │   ├── nerrs.js            # Weeks Bay CDMO dock sensors
│   │   ├── pace.js             # NASA PACE OCI ocean color
│   │   ├── tropomi.js          # Sentinel-5P CH4 methane
│   │   ├── epa.js              # EPA ECHO/WQP/AirNow/TRI
│   │   ├── openeo.js           # Copernicus Algorithm Plaza (8 algorithms)
│   │   ├── database.js         # SQLite persistence (sql.js, 5 tables)
│   │   ├── crossSensor.js      # Cross-sensor feature assembly + auto-labeling
│   │   └── mlTrainer.js        # ML training pipeline (Phase 1-3)
│   └── ml/habOracle.js         # HAB Oracle algorithm
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
- NOAA HF Radar — ERDDAP surface currents
- NERRS CDMO — Weeks Bay dock sensors
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
- NOAA AHPS — flood stage data
- NRCS SSURGO — hydric soil survey
- USGS NWI — National Wetlands Inventory
- FEMA FIRM — flood zone maps
- NLCD 2021 — land cover classification
- EPA ATTAINS — impaired waters 303(d)
- USACE ORM — Section 404 permits
- OpenAQ — global air quality aggregator

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

### New Service Modules (server/services/)
- `satellite.js` — MODIS, VIIRS, HLS, Landsat, Sentinel-2, Copernicus DEM
- `ocean.js` — CMEMS, HYCOM, CoastWatch, StreamStats, Digital Coast
- `ecology.js` — iNaturalist, GBIF, eBird, AmeriFlux
- `landregweather.js` — Open-Meteo, AHPS, NCEI, SSURGO, NWI, FEMA, NLCD, ATTAINS, USACE
- `airplus.js` — EPA AQS, OpenAQ, PurpleAir
- `goes.js` — GOES-19 ABI SST (CoastWatch ERDDAP) + imagery (NOAA STAR CDN)

### New API Routes (server/routes/sensors.js)
- `/api/sensors/satellite/status` — composite satellite status
- `/api/sensors/ocean/status` — composite ocean/coastal status
- `/api/sensors/ecology/status` — composite ecology status
- `/api/sensors/ecology/inaturalist` — iNaturalist observations
- `/api/sensors/ecology/gbif` — GBIF occurrences
- `/api/sensors/ecology/ebird` — eBird observations
- `/api/sensors/land/status` — composite land/regulatory/weather status
- `/api/sensors/land/weather` — Open-Meteo weather
- `/api/sensors/land/flood` — FEMA flood zone lookup
- `/api/sensors/land/wetlands` — NWI wetlands query
- `/api/sensors/land/attains` — EPA impaired waters
- `/api/sensors/airplus/status` — composite air quality status
- `/api/sensors/airplus/openaq` — OpenAQ readings
- `/api/sensors/airplus/purpleair` — PurpleAir PM2.5
- `/api/sensors/goes/status` — GOES-19 SST status
- `/api/sensors/goes/image` — GOES-19 latest imagery (sector/band params)
- `/api/sensors/goes/all` — composite GOES status + imagery

### GOES-19 Live Push Ingest (server/routes/goes19.js)
- `POST /api/goes19/ingest` — Receives Jeff's 5-min GOES-19 pipeline (SST, QPE, cloud mask, RGB, GLM lightning, AMV winds). Auth: `x-api-key` header vs `GOES19_API_KEY` env var. Persists to `sensor_readings` table as source `GOES19-PUSH`.
- `GET /api/goes19/latest` — Returns most recent scan payload
- `GET /api/goes19/health` — Endpoint health/config status

## Key Features

- **Dashboard**: Real-time environmental conditions from 51+ data sources
- **HAB Oracle**: Pre-bloom harmful algal bloom prediction (48-72h, World First™)
- **Water Quality**: Interactive Leaflet map with NASA GIBS satellite overlays
- **Feed Status**: Live status of all data feeds with health indicators
- **Science View**: Multi-source data explorer with dynamic station cards (only shows parameters with data — no empty dashes). NERRS (CDMO OFFLINE badge), USGS (flow + stage + DO₂ + temp), CO-OPS tidal, GOES-19 imagery (live GEOCOLOR), PurpleAir 13 sensors, ecology (eBird + iNaturalist + GBIF), satellites, ocean models (HYCOM + CMEMS), atmospheric (Open-Meteo wind/CAPE/precip + AQI), land/regulatory (FEMA + ATTAINS + NWI + SSURGO + NLCD + USACE). Station compare, correlation scatter (Temp vs DO₂), and comprehensive CSV export.
- **Master Roadmap**: 16 tabs — Vision, Roadmap, Build Progress (51+ feeds, 25+ endpoints, 12 services, env vars, external API health), Intelligence Engine, Scientist Meeting, Hatch Strategy, BCEDA/SITEVAULT, Revenue Model, Opportunities, State Expansion, Private Sector, Osprey Integration, Data Sources, Airbus, Fox 10, Next Sensors.
- **Sensor Registry**: Complete registry of all 51+ data feed integrations
- **WetlandAI**: Wetland pre-delineation module
- **SITEVAULT**: Site assessment data vault
- **Alert Center**: Environmental alerts and notifications
- **AI Field Assistant**: Anthropic-powered environmental Q&A
