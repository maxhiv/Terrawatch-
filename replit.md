# TERRAWATCH v2.0

Planetary Environmental Intelligence Platform — Mobile Bay & Gulf Coast

## Architecture

- **Frontend**: React 18 + Vite (port 5000, host 0.0.0.0)
- **Backend**: Express.js API (port 3001, localhost)
- **Package manager**: npm
- **Runtime**: Node.js 20
- **State management**: Zustand
- **Styling**: Tailwind CSS (light green/white bay theme)
- **Charts**: Recharts
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
│   │   ├── Common/index.jsx    # StatCard, PageHeader, RiskBadge, Spinner, Section, EmptyState, AlertBanner
│   │   ├── Charts/index.jsx    # DOChart, HABProbabilityChart
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
│   │   └── ai.js               # /api/ai/* (Anthropic assistant)
│   ├── services/
│   │   ├── usgs.js             # USGS NWIS water data
│   │   ├── noaa.js             # NOAA CO-OPS, NWS, NDBC
│   │   ├── hfradar.js          # NOAA ERDDAP surface currents
│   │   ├── nerrs.js            # Weeks Bay CDMO dock sensors
│   │   ├── pace.js             # NASA PACE OCI ocean color
│   │   ├── tropomi.js          # Sentinel-5P CH4 methane
│   │   ├── epa.js              # EPA ECHO/WQP/AirNow/TRI
│   │   └── openeo.js           # Copernicus Algorithm Plaza (8 algorithms)
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

## Data Sources

### Tier 1 — No Keys Required
- USGS NWIS — water quality and streamflow (6 stations)
- NOAA CO-OPS — tidal data and water levels
- NOAA NWS — weather forecasts and alerts
- NOAA NDBC — offshore buoy data (Buoy 42012)
- NOAA HF Radar — ERDDAP surface currents
- NERRS CDMO — Weeks Bay dock sensors
- EPA ECHO — facility compliance data
- EPA Water Quality Portal — federal water quality
- EPA TRI — toxic release inventory

### Tier 2 — Free Keys (Optional)
- `AIRNOW_API_KEY` — EPA AirNow AQI data
- `NASA_EARTHDATA_USER` / `NASA_EARTHDATA_PASS` — NASA PACE OCI
- `COPERNICUS_USER` / `COPERNICUS_PASS` — Sentinel-5P / openEO

### Tier 3 — Premium (Optional)
- `ANTHROPIC_API_KEY` — AI Field Assistant
- `VEXCEL_API_KEY` — High-res aerial imagery

## Key Features

- **Dashboard**: Real-time environmental conditions from 22+ government data feeds
- **HAB Oracle**: Pre-bloom harmful algal bloom prediction (48-72h, World First™)
- **Water Quality**: Interactive Leaflet map with NASA GIBS satellite overlays
- **Feed Status**: Live status of all 45 data feeds with health indicators
- **Science View**: Data explorer for advanced analysis
- **Sensor Registry**: Complete registry of all data feed integrations
- **WetlandAI**: Wetland pre-delineation module
- **SITEVAULT**: Site assessment data vault
- **Alert Center**: Environmental alerts and notifications
- **AI Field Assistant**: Anthropic-powered environmental Q&A
