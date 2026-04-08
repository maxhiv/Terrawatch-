# TERRAWATCH — Environmental Intelligence Platform

> **Give the world eyes on its ecosystems.**

Real-time environmental monitoring, HAB/hypoxia prediction, compound flood intelligence, beach safety scoring, industrial site intelligence, and wetland pre-delineation for Mobile Bay and the Gulf Coast of Alabama.

**Owner:** Max A. Hansen IV — Hansen Holdings, Fairhope, Alabama  
**Version:** v2.2  
**Stack:** React 18 + Vite · Express.js · Zustand · sql.js · Node.js 20  
**Status:** 🟢 LIVE — 28+ no-key data sources active, 142-key ML feature vector accumulating, Phase 2 ML active

---

## Table of Contents

1. [Mission & Origin](#1-mission--origin)
2. [Three-Product Architecture](#2-three-product-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Application Routes — 20 Pages](#4-application-routes--20-pages)
5. [Server Structure](#5-server-structure)
6. [Data Sources — 51 Total Feeds](#6-data-sources--51-total-feeds)
7. [GOES-19 Dual-Track Integration](#7-goes-19-dual-track-integration)
8. [ML Architecture — Phase Progression](#8-ml-architecture--phase-progression)
9. [HAB Oracle v2.2 — 11-Factor Ensemble](#9-hab-oracle-v22--11-factor-ensemble)
10. [142-Key Feature Vector](#10-142-key-feature-vector)
11. [Intelligence Engine & Continuous Learning](#11-intelligence-engine--continuous-learning)
12. [Intelligence Product Pages](#12-intelligence-product-pages)
13. [WetlandAI — Remote Pre-Delineation](#13-wetlandai--remote-pre-delineation)
14. [SITEVAULT — Industrial Site Intelligence](#14-sitevault--industrial-site-intelligence)
15. [Cron Architecture](#15-cron-architecture)
16. [Environment Variables Reference](#16-environment-variables-reference)
17. [Deployment](#17-deployment)
18. [Getting Started — Local Development](#18-getting-started--local-development)
19. [Grant Strategy](#19-grant-strategy)
20. [Architecture Principles](#20-architecture-principles)

---

## 1. Mission & Origin

TERRAWATCH began as a fragmentation problem: a biologist at Weeks Bay NERR had to visit six separate government websites to understand what was happening in her own estuary. USGS, NOAA CO-OPS, EPA AQS, ADPH shellfish programs, and NERRS CDMO all operated in complete isolation. TERRAWATCH was conceived as the **fusion layer** — the intelligence surface that no single agency could justify building for itself.

The platform evolved rapidly from its first prototype into a three-product SaaS platform with:

- A 142-key ML feature vector built from 15+ live data sources and updated every 3 minutes
- Full production React + Vite + Express application with 20 distinct pages
- 28+ always-on federal data sources requiring zero API keys
- A continuous learning pipeline auto-labeling HAB, hypoxia, flood, and ecological events
- Four intelligence product pages (Compound Flood, Beach Safety, Climate Vulnerability, Pollution Tracker) providing derived scores no individual agency publishes
- Phase 2 Random Forest + SHAP explainability active; Phase 3 CNN-LSTM pre-wired for Vertex AI activation at 2,000 labeled samples

**The mission:** Build the environmental intelligence platform that serves shellfish managers, state regulators, municipal governments, commercial fisheries, research institutions, and industrial site selectors with one integrated, defensible, explainable system.

---

## 2. Three-Product Architecture

All three products share a single data infrastructure, two-tier cron scheduler, sensor registry, and ML pipeline. Revenue diversification is structural.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SHARED DATA INFRASTRUCTURE                           │
│  51 data sources · GOES-19 dual-track · 142-key ML vector (3min tick)      │
│  sql.js SQLite DB · Zustand global store · 2-tier cron scheduler           │
└──────────────┬────────────────────┬────────────────────┬────────────────────┘
               │                    │                    │
       ┌───────▼──────┐    ┌────────▼───────┐    ┌──────▼──────────┐
       │  TERRAWATCH  │    │   SITEVAULT    │    │   WetlandAI     │
       │    Core      │    │                │    │                 │
       │              │    │ Industrial site│    │ Remote wetland  │
       │ HAB Oracle   │    │ intelligence   │    │ pre-delineation │
       │ Hypoxia      │    │ for BCEDA &    │    │ ResNet-50 U-Net │
       │ Forecast     │    │ site selectors │    │ 1m resolution   │
       │ Compound     │    │                │    │                 │
       │ Flood Engine │    │                │    │                 │
       │ Beach Safety │    │                │    │                 │
       │ Climate Vuln │    │                │    │                 │
       │ Pollution    │    │                │    │                 │
       │ Tracker      │    │                │    │                 │
       └──────────────┘    └────────────────┘    └─────────────────┘
```

---

## 3. Technology Stack

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  FRONTEND                                                                    │
│  React 18 + Vite 6 · Zustand 5 · Tailwind CSS (bay-* palette)              │
│  Recharts · Leaflet · React Router DOM 7 · Lucide React · date-fns          │
├──────────────────────────────────────────────────────────────────────────────┤
│  BACKEND                                                                     │
│  Node.js 20 + Express.js 4 · Axios · node-cron · express-rate-limit        │
│  sql.js 1.14 (SQLite via WASM, no native compilation) · dotenv · cors       │
├──────────────────────────────────────────────────────────────────────────────┤
│  ML / INTELLIGENCE                                                           │
│  Phase 1: Logistic regression (JS, always active)                           │
│  Phase 2: Random Forest + Permutation SHAP (JS, active ≥100 labeled)       │
│  Phase 3: CNN-LSTM on Vertex AI (pre-wired, activates at ≥2000 labeled)    │
│  Phase 3+: ST-Transformer, Spatio-Temporal GNN, PI-RNN (pre-wired)         │
├──────────────────────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE                                                              │
│  Replit (current, always-on) · GCP Cloud Run (production target)            │
│  GCP Cloud Build CI/CD · Vertex AI (Phase 3) · BigQuery (pipeline spec)    │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Layer | Technology | Notes |
|---|---|---|
| Frontend framework | React 18 + Vite 6 | Port 5000, host 0.0.0.0 |
| State management | Zustand 5 | Global store for all sensor data, loading, GOES-19, alerts |
| Styling | Tailwind CSS + bay-* palette | Glassmorphism theme — frosted glass cards, gradient bg, risk tints |
| Charts | Recharts | Inline sparklines in StatCards; area, line, scatter charts |
| Maps | Leaflet | Esri WorldImagery basemap + 4 live GOES/MODIS overlay layers |
| Backend | Node.js 20 + Express.js 4 | Port 3001; trust proxy, rate limiting, CORS |
| Database | sql.js (SQLite WASM) | `data/terrawatch.db`; no native compilation; Replit-compatible |
| HTTP client | Axios | All external API calls with timeout + error handling |
| Scheduling | node-cron | Fast (3min), slow (15min), nightly retrain |
| Build | Vite 6 production build | ESM module type; `concurrently` for dev |

**npm scripts:**
```bash
npm run dev          # Both frontend (5000) + backend (3001) via concurrently
npm run dev:client   # Frontend only (Vite HMR)
npm run dev:server   # Backend only (node --watch)
npm run build        # Vite production build → /dist
npm start            # Production: node server/index.js
```

---

## 4. Application Routes — 20 Pages

All pages are React Router DOM v7 routes wrapped in a shared `Layout.jsx` sidebar (22 nav links, "142 KEYS" DataStream badge, 4 NEW product badges).

| Route | Page Component | Purpose |
|---|---|---|
| `/` | `Dashboard.jsx` | Real-time KPI grid; GOES alert strip; UV/gust/PM2.5 extended cards |
| `/hab` | `HabOracle.jsx` | 11-factor HAB probability gauge; 72h outlook; risk factors; data quality |
| `/hypoxia` | `HypoxiaForecast.jsx` | Halocline-based DO₂ floor forecast; Jubilee detection conditions |
| `/water` | `WaterQuality.jsx` | Interactive water quality map; all USGS + CO-OPS + NERRS parameters |
| `/map` | `MapPage.jsx` | Satellite basemap with 4 live overlay layers (GOES SST, MODIS Chl, etc.) |
| `/compound-flood` | `CompoundFlood.jsx` | **NEW** AHPS stage + GOES QPE + USGS flow + Open-Meteo; compound risk 0–100 |
| `/beach-safety` | `BeachSafety.jsx` | **NEW** Swim safety index 0–100; ADPH closures; NDBC + HF Radar conditions |
| `/climate` | `ClimateVulnerability.jsx` | **NEW** SST trend + DO₂ + heat index; vulnerability index with trend accumulation |
| `/pollution` | `PollutionTracker.jsx` | **NEW** Multi-source PM2.5; turbidity; orthophosphate; NPDES compliance |
| `/data-stream` | `DataStream.jsx` | 142-key feature vector explorer (9 tabs across all data domains) |
| `/science` | `ScienceView.jsx` | Scientist evaluation: time series, station compare, correlation, export |
| `/intelligence` | `Intelligence.jsx` | ML phase status; DB stats; Phase 3 readiness; auto-label event log |
| `/sensors` | `SensorsRegistry.jsx` | All data feeds with auth requirements, status, live previews |
| `/feeds` | `FeedStatus.jsx` | Mission control for all data feeds; setup guide |
| `/wetland` | `WetlandAI.jsx` | U-Net v2 wetland pre-delineation; BIOPAR + NERRS validation |
| `/sitevault` | `SITEVAULT.jsx` | Industrial site intelligence for BCEDA and site selectors |
| `/alerts` | `Alerts.jsx` | All threshold-crossing alerts: hypoxia, bloom, flood, air quality |
| `/ml` | `MLArchitecture.jsx` | ML architecture docs: models, PACE, SHAP, Phase 3 spec |
| `/ai` | `AIAssistant.jsx` | Claude-powered expert Q&A with live sensor context |
| `/vision` | `Vision.jsx` | Platform vision; computer vision + satellite imagery interface |

---

## 5. Server Structure

```
server/
├── index.js                    # Express entry — trust proxy, CORS, rate limiting,
│                               # all routes mounted, alert engine, nightly retrain cron
├── routes/
│   ├── waterQuality.js         # /api/water/*
│   ├── habOracle.js            # /api/hab/*
│   ├── weather.js              # /api/weather/*
│   ├── alerts.js               # /api/alerts
│   ├── sensors.js              # /api/sensors/*  (incl. /goes/all dual-track merge)
│   ├── goes19.js               # /api/goes19/*   (push ingest + DB lookup)
│   ├── ai.js                   # /api/ai/*
│   ├── intelligence.js         # /api/intelligence/*  (feature-keys, export-csv,
│   │                           #   explain/SHAP, source-health)
│   ├── mlArchitecture.js       # /api/ml/*
│   ├── flood.js                # /api/flood/status
│   ├── beach.js                # /api/beach/status
│   ├── climate.js              # /api/climate/status
│   └── pollution.js            # /api/pollution/status
├── services/
│   ├── usgs.js                 # USGS NWIS (6 stations, gage_height, orthophosphate, total_nitrogen)
│   ├── noaa.js                 # NOAA CO-OPS, NWS, NDBC Buoy 42012
│   ├── hfradar.js              # NOAA ERDDAP surface currents (3-endpoint fallback: 6km→1km→THREDDS)
│   ├── nerrs.js                # Weeks Bay CDMO (primary wekbwq + secondary wekbwq2)
│   ├── pace.js                 # NASA PACE OCI ocean color
│   ├── tropomi.js              # Sentinel-5P CH₄ methane
│   ├── epa.js                  # EPA ECHO / WQP / AirNow / TRI
│   ├── openeo.js               # Copernicus Algorithm Plaza (8 algorithms)
│   ├── adph.js                 # Alabama Dept of Public Health shellfish closures
│   ├── database.js             # sql.js SQLite (writeSourceHealth, getSourceHealthSummary)
│   ├── crossSensor.js          # Cross-sensor feature assembly → 142-key vector;
│   │                           #   corrected autoLabel (K. brevis: warm+salty+calm+highChl+summer)
│   ├── mlTrainer.js            # ML training pipeline (Phase 1–3, RF, SHAP, exportVectorsCSV)
│   ├── satellite.js            # MODIS, VIIRS, HLS, Landsat, Sentinel-2, Copernicus DEM
│   ├── ocean.js                # CMEMS, HYCOM, CoastWatch, StreamStats, Digital Coast
│   ├── ecology.js              # iNaturalist, GBIF, eBird, AmeriFlux
│   ├── landregweather.js       # Open-Meteo, AHPS (XML), NCEI, SSURGO, NWI, FEMA, NLCD,
│   │                           #   ATTAINS, USACE
│   ├── airplus.js              # EPA AQS, OpenAQ, PurpleAir
│   └── goes.js                 # GOES-19 ABI SST (CoastWatch ERDDAP) + imagery (NOAA STAR CDN)
└── ml/
    ├── habOracle.js            # HAB Oracle algorithm (11 factors, PAR, halocline, Jubilee)
    ├── randomForest.js         # Phase 2 Random Forest ensemble
    ├── shap.js                 # Permutation SHAP explainability
    ├── stfGnn.js               # Spatio-temporal GNN (Phase 3 pre-wire)
    ├── stTransformer.js        # Spatio-temporal Transformer (Phase 3 pre-wire)
    └── piRnn.js                # Physics-informed RNN (Phase 3 pre-wire)
```

### Key API Endpoints

```
# Water & Environmental
GET  /api/water/realtime                        All active station readings
GET  /api/water/historical/:siteNo/:paramCode

# HAB Oracle
GET  /api/hab/assess                            Full 11-factor HAB assessment
GET  /api/hab/probability                       Bloom probability 0.0–1.0
GET  /api/hab/risk-factors                      Ranked contributing signals
GET  /api/hab/outlook                           72-hour probabilistic outlook

# Intelligence Products (v2.2)
GET  /api/flood/status                          Compound flood risk score (0–100)
GET  /api/beach/status                          Swim safety index (0–100) + ADPH closures
GET  /api/climate/status                        Climate vulnerability index + SST trend
GET  /api/pollution/status                      Multi-source pollution index

# GOES-19 Dual-Track
GET  /api/goes19/status                         Push pipeline health + last ingest timestamp
GET  /api/goes19/latest                         Latest scalar extraction (12 push fields)
GET  /api/goes19/features                       ML features injected from GOES-19
POST /api/goes19/ingest                         Ground station push (GOES19_API_KEY auth)
GET  /api/sensors/goes/all                      Merged: status (ERDDAP) + imagery (CDN) + push (DB)

# ML / Intelligence
GET  /api/intelligence/status                   ML phase, DB stats, Phase 3 readiness
GET  /api/intelligence/feature-keys            All 142 feature key names + domains
POST /api/intelligence/explain                  Permutation SHAP — returns feature importance
GET  /api/intelligence/export-csv               Full labeled training dataset export
GET  /api/intelligence/source-health            Data source uptime monitoring
POST /api/intelligence/retrain                  Manual retrain trigger

# Other
GET  /api/weather/current                       NWS + NDBC + CO-OPS composite
GET  /api/alerts                                All active threshold events
GET  /api/sensors                               Full data feed registry
POST /api/ai                                    Claude Field Assistant (live sensor context)
```

---

## 6. Data Sources — 51 Total Feeds

### Tier 1 — No API Keys Required (28 sources, always-on)

| Source | Data | Notes |
|---|---|---|
| USGS NWIS | DO, temperature, salinity, turbidity, nitrate, orthophosphate, total nitrogen, gage height | 6 stations, 15-min |
| NOAA CO-OPS | Water level, salinity, currents, SST, air temp, wind | 6-min |
| NOAA NWS | 7-day forecast, alerts | Open-Meteo also used as no-key fallback |
| NOAA NDBC | Wave height, period, SST, air pressure, wind | Buoy 42012 |
| NOAA HF Radar | Surface current vectors | ERDDAP 3-endpoint fallback: 6km → 1km → THREDDS |
| NERRS CDMO Weeks Bay | Full estuarine suite + meteorology | Primary (wekbwq) + secondary (wekbwq2) |
| EPA ECHO | Industrial discharge permit compliance | |
| EPA Water Quality Portal | Federal water quality aggregation | |
| EPA TRI | Toxic Release Inventory | |
| GOES-19 ABI | SST + true color imagery | NOAA STAR CDN, no key for imagery |
| Copernicus DEM GLO-30 | 30m global digital elevation | |
| HYCOM | 3D currents, temperature, salinity profiles | |
| NOAA CoastWatch ERDDAP | SST, chlorophyll, sea surface height | |
| USGS StreamStats | Watershed delineation | |
| NOAA Digital Coast | Coastal elevation, lidar | |
| iNaturalist | Citizen science biodiversity | |
| GBIF | Global biodiversity occurrence records | |
| Open-Meteo | 7-day weather forecast | Fixed hour index extraction |
| NOAA AHPS | River flood stage | XML stage parsing |
| NRCS SSURGO | Hydric soil survey, drainage class | |
| USGS NWI | National Wetlands Inventory | |
| FEMA FIRM | Flood Insurance Rate Maps | |
| NLCD 2021 | National Land Cover Database | |
| EPA ATTAINS | Impaired waters 303(d) listings | |
| USACE ORM | Section 404 permit data | |
| OpenAQ | Global air quality aggregator | |
| ADPH | Alabama Dept of Public Health shellfish closures | |

### Tier 2 — Free API Keys (10 sources, optional)

| Secret(s) | Source | Activates |
|---|---|---|
| `NASA_EARTHDATA_USER` + `PASS` | urs.earthdata.nasa.gov | NASA PACE OCI, MODIS, VIIRS, HLS, Landsat (5 sources) |
| `COPERNICUS_USER` + `PASS` | dataspace.copernicus.eu | Sentinel-2, TROPOMI CH₄, CMEMS ocean (3 sources) |
| `AIRNOW_API_KEY` | docs.airnowapi.org | Real-time AQI — PM2.5, O₃, NO₂ |
| `EBIRD_API_KEY` | ebird.org/api/keygen | eBird waterbird distribution |
| `AQS_EMAIL` + `AQS_API_KEY` | aqs.epa.gov | EPA AQS official monitor network |
| `NCEI_API_KEY` | ncdc.noaa.gov | NOAA NCEI historical climate records |
| `PURPLEAIR_API_KEY` | develop.purpleair.com | 30k+ community PM2.5 sensors |
| `AMERIFLUX_TOKEN` | ameriflux.lbl.gov | Carbon flux tower data |

### Tier 3 — Premium / Partnership

| Secret | Source | Activates |
|---|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com | AI Field Assistant (Claude expert Q&A) |
| `GOES19_API_KEY` | Internal shared secret | GOES-19 ground station push ingest |
| `VEXCEL_API_KEY` | vexceldata.com | 7.5cm ortho + 50cm DTM for WetlandAI |

**Currently configured:** `NASA_EARTHDATA_USER+PASS`, `COPERNICUS_USER+PASS`, `AIRNOW_API_KEY` — activates 38+ of 51 sources at zero cost.

---

## 7. GOES-19 Dual-Track Integration

GOES-19 operates on two parallel tracks in TERRAWATCH v2.2.

### Track 1 — Ground Station Push Pipeline

A partner ground station processes raw GOES-19 ABI data and pushes scalar extractions to TERRAWATCH every 5 minutes via `POST /api/goes19/ingest` (authenticated with `GOES19_API_KEY`).

**AOI:** 29.8°N–31.2°N, 87.3°W–89.0°W  
**Volume:** ~288 pushes/day, <2KB per payload

**Push fields extracted:**

| Field | Description | ML Priority |
|---|---|---|
| `sst_mean` | Bay mean SST (°C) | CRITICAL — thermal stratification precursor |
| `sst_gradient` | Spatial SST gradient (°C/km) | CRITICAL — >3.5°C precedes DO₂ crash 6–24h |
| `qpe_rainfall` | Instantaneous rainfall rate | HIGH — nutrient pulse trigger |
| `qpe_6h` | 6-hour cumulative QPE | HIGH |
| `qpe_24h` | 24-hour cumulative QPE | HIGH |
| `cloud_coverage` | Bay clear-sky % | HIGH — satellite acquisition scheduler |
| `glm_flashes` | Lightning flash count | MEDIUM — convective mixing detection |
| `glm_active` | Active convective cell flag | MEDIUM |
| `amv_wind_speed` | Atmospheric Motion Vector wind | MEDIUM — bloom transport |
| `amv_wind_dir` | AMV wind direction | MEDIUM |
| `bloom_index` | Band ratio bloom surface indicator | HIGH |
| `turbidity_idx` | Surface turbidity index | HIGH |

**Database flow:** Push → `goes19_ingest` table → `getLatestGOESReadings()` → `_latestData.goesLatest` → ML feature vector + frontend store.

### Track 2 — ERDDAP Pull (CoastWatch)

`server/services/goes.js` polls the CoastWatch ERDDAP endpoint for GOES-19 ABI SST products. Currently returns 404 (ERDDAP dataset pending); falls back to push track automatically.

### Frontend Merge

`GET /api/sensors/goes/all` returns a merged object with three fields: `status` (ERDDAP), `imagery` (NOAA STAR CDN tiles), and `push` (SQLite DB).

---

## 8. ML Architecture — Phase Progression

```
PHASE 0  (always)    → Accumulate labeled samples via auto-labeling engine
PHASE 1  (active)    → Logistic regression, 142-key vector, JS — always-on
PHASE 2  (active ≥100 labeled) → Random Forest ensemble + Permutation SHAP, JS
PHASE 3  (≥2000 labeled)       → CNN-LSTM on Vertex AI (pre-wired: stfGnn.js, stTransformer.js, piRnn.js)
PHASE 3+ (future)   → ST-Transformer · Spatio-Temporal GNN · Physics-Informed RNN
```

### Phase 2 — Random Forest + SHAP (Active)

**Activation threshold:** 100 labeled samples  
**Algorithm:** Random Forest ensemble (JavaScript)  
**Explainability:** Permutation SHAP via `server/ml/shap.js`  
**SHAP endpoint:** `POST /api/intelligence/explain` → returns per-feature importance values  
**Retrain schedule:** Nightly cron (8 AM), automatic if new samples accumulated

### Phase 3 — CNN-LSTM (Vertex AI, Pre-Wired)

**Activation threshold:** 2,000 labeled samples + `GCP_PROJECT` + `VERTEX_SERVICE_ACCOUNT_KEY` configured

**Architecture:**
```
Input tensor: [time_steps=72, features=142] per sample
→ CNN layers:  1D convolutions — local pattern extraction (Chl spikes, SST gradients)
→ LSTM layers: Long-term temporal dependencies (multi-day precursor signals)
→ Attention:   Weighted feature importance for SHAP interpretability
→ Output:      HAB probability + calibrated uncertainty bounds
```

**Pre-wired Phase 3+ files (server/ml/):**
- `stfGnn.js` — Spatio-temporal GNN over bay sensor graph topology
- `stTransformer.js` — Spatio-temporal Transformer for hypoxia spatial prediction
- `piRnn.js` — Physics-Informed RNN embedding advection-diffusion PDEs as hard loss constraints

**PINNs rationale:** Physics-Informed Neural Networks embed the advection-diffusion equations governing nutrient transport as constraints in the network loss function. This ensures model outputs remain physically plausible during sensor outages and satellite cloud gaps — a hard requirement for scientific defensibility with Weeks Bay NERR and DISL reviewers.

---

## 9. HAB Oracle v2.2 — 11-Factor Ensemble

The HAB Oracle v2.2 is a weighted ensemble of 11 factors replacing the pure logistic regression of Phase 1.

### Factor Groups

**6 Legacy Factors**
1. Chlorophyll-a concentration (NERRS + PACE OCI)
2. Water temperature (CO-OPS + NERRS)
3. Salinity (CO-OPS + NERRS)
4. Wind speed and direction (NDBC + CO-OPS)
5. Dissolved oxygen trend (USGS + NERRS)
6. River discharge / nutrient load proxy (USGS gauge)

**4 GOES-19 Injected Factors**
7. SST gradient (thermal stratification precursor)
8. QPE cumulative rainfall (nutrient pulse trigger, 6h/24h windows)
9. Bloom index (band ratio surface detection)
10. GLM convective flag (mixing event indicator)

**1 New Factor — v2.2**
11. PAR bloom growth risk (photosynthetically active radiation × nutrient × temp composite)

### Hypoxia Forecast — Halocline-Based Stratification Model

The Hypoxia Forecast module uses a halocline-based stratification model rather than a simple threshold. Key improvements in v2.2:

- **Jubilee detection conditions:** Identifies the specific combination of calm wind, strong halocline, and overnight DO₂ depletion that precedes a Mobile Bay Jubilee event (mass stranding of fish and crustaceans seeking oxygenated water at the shoreline)
- **Stratification index:** Computed from salinity gradient (CO-OPS surface vs. HYCOM bottom) and SST gradient (GOES-19)
- **Output:** NORMAL / ELEVATED / CRITICAL / JUBILEE status with 5-day probabilistic outlook

### Auto-Labeling — Corrected K. brevis Ecology

The auto-labeling engine in `crossSensor.js` was corrected in v2.2. A HAB-positive label requires:

```
warm (SST > 25°C) AND salty (salinity > 28 ppt) AND calm (wind < 8 m/s)
AND highChl (Chl-a > bloom threshold) AND summer (month 5–10)
≥ 3 of 5 conditions met → HAB positive label
```

This corrects a prior false-positive issue where cold, low-salinity winter conditions were being labeled as bloom events.

---

## 10. 142-Key Feature Vector

The 142-key feature vector is assembled in `server/services/crossSensor.js` every 3 minutes from 15+ live data sources and written to the `feature_vectors` table in SQLite. All 142 keys are browsable in the DataStream page (`/data-stream`) with 9 domain tabs.

### Domain Breakdown

| Domain | Key Count | Sources |
|---|---|---|
| Water column in-situ | ~30 | USGS NWIS (6 stations), CO-OPS, NERRS (primary + secondary) |
| Hydrological / watershed | ~15 | USGS NWIS flow, CO-OPS tidal, AHPS flood stage, Open-Meteo precipitation |
| Atmospheric | ~20 | NDBC Buoy 42012, NWS, CO-OPS wind, Open-Meteo |
| GOES-19 push fields | 12 | Ground station push (see Section 7) |
| Satellite-derived | ~25 | PACE OCI, MODIS, VIIRS, Sentinel-2, TROPOMI, CMEMS |
| Ocean model | ~15 | HYCOM 3D profiles, CoastWatch SSH/SST |
| Ecology / biodiversity | ~10 | GBIF, iNaturalist, eBird, AmeriFlux |
| Air quality | ~10 | AirNow, EPA AQS, OpenAQ, PurpleAir |
| Regulatory / land | ~5 | FEMA NFHL, EPA ECHO, ATTAINS, NLCD |

**Key endpoints:**
```
GET  /api/intelligence/feature-keys    All 142 key names + domain labels
GET  /api/intelligence/export-csv      Full labeled training dataset (CSV)
POST /api/intelligence/explain         SHAP values for a given input vector
GET  /api/intelligence/source-health   Per-source data freshness + uptime
```

---

## 11. Intelligence Engine & Continuous Learning

### Auto-Labeling Event Types

The engine in `crossSensor.js` watches all incoming reads and auto-labels six event types:

| Event | Trigger rule | Signal |
|---|---|---|
| HAB precursor | Chl-a ↑ + DO ↓ + calm wind + warm + salty | Bloom initiation |
| Hypoxia event | DO < 4.0 mg/L sustained | Threshold crossing |
| SST stratification | GOES-19 gradient > 3.5°C | Pre-hypoxia thermal structure |
| Nutrient pulse | QPE > threshold + USGS discharge spike | Watershed N/P loading |
| Bloom active | Chl-a > bloom threshold + PACE confirmation | Confirmed bloom |
| Convective mixing | GLM active + DO bounce | Post-storm mixing event |

### Database Schema (sql.js / SQLite — `data/terrawatch.db`)

```
sensor_readings      Raw ingested values (all sources, all parameters, every tick)
feature_vectors      142-key ML input snapshots (one per 3-min fast cron)
hab_events           Auto-labeled bloom/hypoxia/precursor events
retrain_log          Nightly retrain history: AUC-ROC, accuracy, training N, timestamp
goes19_ingest        GOES-19 push raw scalar extractions
model_registry       Deployed model versions + performance metrics
source_health        Per-source freshness + uptime tracking
```

### Phase 3 Activation Checklist

- [ ] ≥ 2,000 feature vectors accumulated
- [ ] ≥ 200 confirmed labeled samples
- [ ] `GCP_PROJECT` configured in environment
- [ ] `VERTEX_SERVICE_ACCOUNT_KEY` configured
- [ ] Phase 3 activation banner triggers in `/intelligence` page

---

## 12. Intelligence Product Pages

These four pages transform the raw sensor fusion into scored, actionable intelligence products. All data was already ingested; v2.2 adds the product layer.

### Compound Flood — `/compound-flood`

**Data sources:** NOAA AHPS river stage (XML) + GOES-19 QPE rainfall + USGS streamflow gauges + Open-Meteo 7-day precipitation forecast  
**Output:** Compound flood risk score (0–100) decomposed by contributing factor: coastal surge, riverine flooding, pluvial (rainfall-driven), and compound overlap  
**Route:** `GET /api/flood/status`  
**Market:** Baldwin County emergency management, BCEDA site risk, municipal flood insurance contexts

### Beach Safety — `/beach-safety`

**Data sources:** HAB Oracle probability + USGS/NERRS DO + AirNow AQI + EPA ATTAINS beach closure history + NDBC Buoy 42012 (waves, wind) + HF Radar surface currents + ADPH shellfish closures  
**Output:** Swim safety index A–F (0–100) per beach/water access point; updated daily  
**Route:** `GET /api/beach/status`  
**Market:** Tourism, recreational fisheries, public health, Baldwin County municipalities

### Climate Vulnerability — `/climate`

**Data sources:** GOES-19 SST trend + USGS/NERRS DO₂ trend + NWS heat index + NOAA CO-OPS sea level + FEMA NFHL flood zones + NLCD impervious surface  
**Output:** Climate vulnerability index with long-term trend accumulation; parcel-scale scoring specified  
**Route:** `GET /api/climate/status`  
**Market:** Baldwin County planning, insurance, CDBG-DR federal grant compliance

### Pollution Tracker — `/pollution`

**Data sources:** OpenAQ + PurpleAir + EPA AQS (multi-source PM2.5 fusion) + USGS turbidity + NERRS orthophosphate + USGS total nitrogen + EPA ECHO NPDES compliance  
**Output:** Multi-source pollution index; water turbidity + nutrient loading chain; NPDES compliance flag  
**Route:** `GET /api/pollution/status`  
**Market:** Environmental justice, ADEM, MBNEP watershed management, shellfish closure attribution

---

## 13. WetlandAI — Remote Pre-Delineation

### Architecture

```
Input: Multi-band satellite stack
  → NDWI (Normalized Difference Water Index) — Sentinel-2 B3/B8
  → NDVI (Normalized Difference Vegetation Index) — Sentinel-2 B4/B8
  → SRTM elevation (30m) — topographic wetness index
  → NWI (National Wetland Inventory) — baseline wetland classification

Model: ResNet-50 U-Net v2
  → Encoder: ResNet-50 pretrained backbone
  → Decoder: U-Net skip connections for pixel-level classification
  → Output: Binary wetland / non-wetland mask at 1-meter resolution
  → Validation: NERRS CDMO Weeks Bay boundary ground truth
  → Blue carbon: ESA BIOPAR FAPAR for Spartina alterniflora biomass estimation
```

### Products

- Preliminary wetland boundary maps (1m resolution)
- Jurisdictional wetland probability surface
- Pre-survey risk screening reports for 404/401 permitting consultants
- Blue carbon biomass estimation (Spartina mapping with BIOPAR)

### Target Markets

AL/FL/MS environmental consulting firms, ALDOT, USACE permitting consultants, Baldwin County developers requiring 404/401 pre-screening

---

## 14. SITEVAULT — Industrial Site Intelligence

SITEVAULT packages the TERRAWATCH data infrastructure into a commercial real estate due diligence product for economic development organizations and industrial site selectors.

### Data Layers

| Layer | Sources | Customer Value |
|---|---|---|
| Flood risk | FEMA NFHL + GOES-19 QPE + Compound Flood Engine | Facility flood exposure scoring |
| Environmental compliance | EPA ECHO discharge permits + violations | Regulatory liability screening |
| Air quality baseline | EPA AQS + AirNow + PurpleAir | Facility siting air quality context |
| Ecological proximity | WetlandAI + USACE ORM + NWI | 404 permit risk proximity analysis |
| Stormwater capacity | NRCS SSURGO + NLCD impervious + FEMA SFHA | MS4 compliance capacity |
| HAB/hypoxia risk | HAB Oracle + Hypoxia Forecast | Water intake risk for industrial users |
| Nutrient loading | USGS orthophosphate + total nitrogen | Watershed nutrient context |

**Key stakeholder:** Baldwin County Economic Development Alliance (BCEDA)

---

## 15. Cron Architecture

TERRAWATCH v2.2 uses a two-tier cron system to balance freshness with external API rate limits.

### Fast Cron — Every 3 Minutes

Fetches all time-sensitive in-situ sources and writes to SQLite:

- USGS NWIS (6 stations)
- NOAA CO-OPS
- NERRS CDMO Weeks Bay (primary + secondary)
- NOAA HF Radar (3-endpoint fallback)
- EPA AirNow
- GOES-19 DB lookup (`getLatestGOESReadings()`)
- NDBC Buoy 42012
- NWS Weather

**Also on every fast tick:** `crossSensor.js` assembles the 142-key feature vector, runs auto-labeling, and writes `sensor_readings` + `feature_vectors` + `hab_events`.

### Slow Cron — Every 15 Minutes

Fetches satellite and model sources with higher latency tolerance:

- NASA CMR (PACE OCI, MODIS, VIIRS, HLS, Landsat)
- Ocean models (HYCOM, CMEMS, CoastWatch)
- Ecology (iNaturalist, GBIF, eBird)
- Land/weather (Open-Meteo, AHPS, NCEI, SSURGO, NWI, FEMA, NLCD, ATTAINS, USACE)
- Air quality (EPA AQS, OpenAQ, PurpleAir)

### Nightly Cron — 8 AM Daily

- `mlTrainer.js` — Random Forest retrain (Phase 2) with Permutation SHAP evaluation
- AUC-ROC computed; auto-promotes model if improved
- Result written to `retrain_log`

### Alert Engine

`evaluateAndDispatchAlerts()` runs after every fast-cron tick and evaluates thresholds across six categories: hypoxia, halocline stratification, bloom, compound stress, flood stage, and air quality. Active alerts are persisted to SQLite and served at `GET /api/alerts`.

---

## 16. Environment Variables Reference

All secrets managed as Replit Secrets in development. Production: GCP Secret Manager.

| Secret | Source | What it activates |
|---|---|---|
| `NASA_EARTHDATA_USER` | urs.earthdata.nasa.gov (free) | PACE OCI, MODIS, VIIRS, HLS, Landsat via NASA CMR |
| `NASA_EARTHDATA_PASS` | Same account | Same |
| `COPERNICUS_USER` | dataspace.copernicus.eu (free) | Sentinel-2, TROPOMI CH₄, CMEMS |
| `COPERNICUS_PASS` | Same account | Same |
| `AIRNOW_API_KEY` | docs.airnowapi.org (free) | Real-time AQI — PM2.5, O₃, NO₂ |
| `EBIRD_API_KEY` | ebird.org/api/keygen (free) | eBird waterbird observations |
| `AQS_EMAIL` + `AQS_API_KEY` | aqs.epa.gov/data/api/signup (free) | EPA AQS official monitors |
| `NCEI_API_KEY` | ncdc.noaa.gov/cdo-web/token (free) | NOAA NCEI historical climate |
| `PURPLEAIR_API_KEY` | develop.purpleair.com (free tier) | PurpleAir 30k+ PM2.5 sensors |
| `AMERIFLUX_TOKEN` | ameriflux.lbl.gov/data/register (free) | Carbon flux tower data |
| `GOES19_API_KEY` | Internal — generate secure string | Authenticates ground station push |
| `ANTHROPIC_API_KEY` | console.anthropic.com (paid) | AI Field Assistant (Claude) |
| `GCP_PROJECT` | console.cloud.google.com | Phase 3 Vertex AI training |
| `VERTEX_SERVICE_ACCOUNT_KEY` | GCP IAM (JSON) | Phase 3 Vertex AI auth |
| `VEXCEL_API_KEY` | vexceldata.com (enterprise quote) | 7.5cm ortho + 50cm DTM |

**Currently configured:** `NASA_EARTHDATA_USER+PASS`, `COPERNICUS_USER+PASS`, `AIRNOW_API_KEY`  
**Pending registration (all free):** `AQS_EMAIL+AQS_API_KEY`, `NCEI_API_KEY`, `EBIRD_API_KEY`, `PURPLEAIR_API_KEY`, `AMERIFLUX_TOKEN`

---

## 17. Deployment

### Current: Replit (Always-On)

- Persistent file storage at `data/terrawatch.db`
- Environment secrets via Replit Secrets
- Always-on Node.js hosting
- Frontend served on port 5000; backend API on port 3001

### Production Target: GCP Cloud Run

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["node", "server/index.js"]
```

**GCP stack:**
- **Cloud Run** — containerized Express server
- **Cloud Build** — CI/CD from GitHub `main` branch
- **Vertex AI** — Phase 3 CNN-LSTM training jobs
- **BigQuery** — data pipeline (specified, not yet deployed)
- **Secret Manager** — all env vars in production

---

## 18. Getting Started — Local Development

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
git clone https://github.com/maxhiv/Terrawatch-.git
cd Terrawatch-
npm install
```

### Configure Environment

```bash
cp .env.example .env
# Minimum to activate 28 no-key sources immediately (no configuration needed):
# Just run npm run dev — Tier 1 sources are zero-config

# To activate 38+ sources, add to .env:
NASA_EARTHDATA_USER=your_username
NASA_EARTHDATA_PASS=your_password
COPERNICUS_USER=your_username
COPERNICUS_PASS=your_password
AIRNOW_API_KEY=your_key
```

### Run Development

```bash
npm run dev
# Frontend: http://localhost:5000
# Backend API: http://localhost:3001
# Vite proxies all /api/* requests to :3001 automatically
```

### Database

`data/terrawatch.db` is created automatically on first server start. Schema is initialized in `server/services/database.js`. No migrations required.

### Verify Data Ingestion

```bash
# Check all source health:
curl http://localhost:3001/api/intelligence/source-health

# Check feature vector accumulation:
curl http://localhost:3001/api/intelligence/status

# Check GOES-19 dual-track:
curl http://localhost:3001/api/sensors/goes/all
```

---

## 19. Grant Strategy

Federal grants are scientific validation infrastructure that make every commercial sale easier. A NOAA-funded platform is a peer-reviewed platform.

| Grant Program | Award Size | Stage | Role |
|---|---|---|---|
| Hatch Fairhope Foundation | $36,000 | Apply immediately | PI (private company eligible) |
| NERRS Science Collaborative | $100K–$300K | LOI Month 2 | Subcontractor / co-PI |
| Mississippi-Alabama Sea Grant | $50K–$150K | Pre-proposal Month 3 | Subcontractor |
| NOAA HABHRCA | $200K–$500K | Full proposal Month 6 | Subcontractor |
| EPA National Estuary Program | $50K–$200K | Year 1–2 | Subcontractor |
| RESTORE Act Science Program | $100K–$500K | Year 2 | Subcontractor |
| NSF EarthCube / Convergence | $200K–$1M | Year 2 | Co-PI eligible |
| NOAA SBIR Phase I + II | $150K–$1.5M | Year 2 | PI (private company required) |

### Regulatory Defensibility Requirements (Built Into v2.2)

- **SHAP explainability:** `POST /api/intelligence/explain` active in Phase 2; required for EPA grant defensibility
- **AUC-ROC tracking:** Written to `retrain_log` at every nightly retrain; exposed in `/intelligence`
- **Source health monitoring:** Per-source uptime at `/api/intelligence/source-health`
- **Physics-Informed RNN:** Pre-wired in `server/ml/piRnn.js` — ensures physically consistent gap-filling under sensor outages (scientifically defensible to Weeks Bay NERR and DISL reviewers)
- **Jubilee detection:** Halocline-based hypoxia model is directly relevant to Mobile Bay fisheries science — strongest narrative hook for NOAA HABHRCA and Sea Grant programs

---

## 20. Architecture Principles

These design decisions make TERRAWATCH defensible to EPA grant officers, explainable to PhD scientists, and meaningful to fishing communities.

**1. Data fusion creates intelligence no single agency achieves alone.**  
The HAB Oracle v2.2 is only possible because GOES-19 thermal, USGS discharge, NERRS chlorophyll, ADPH shellfish history, and PACE spectral data are fused into a single 142-key feature vector. No individual agency can see what TERRAWATCH can see.

**2. Observational blindness is a first-class architectural problem.**  
Four identified blindness types (optical cloud cover, spatial gaps, subsurface blindness, upstream precursor gaps) each have named mitigation strategies: GOES-19 thermal fills cloud gaps, HYCOM fills subsurface gaps, HF Radar fills spatial current gaps, upstream USGS gauges fill precursor gaps.

**3. Explainability is non-optional.**  
SHAP values at inference are required for every grant submission and every conversation with an ADEM regulator. The Phase 2 SHAP endpoint is live. Black-box models don't get deployed here.

**4. Physics must constrain the ML.**  
The Physics-Informed RNN embeds advection-diffusion PDEs as hard loss constraints. The bay doesn't violate physics when a sensor goes offline — neither should our forecasts.

**5. Jubilee is the product story for Mobile Bay.**  
A Jubilee — the mass stranding of oxygen-depleted fish along the Eastern Shore — is the most visceral demonstration of hypoxia's ecological damage and the most compelling narrative for a grant officer, a journalist, or a fisherman. The Jubilee detection model is both scientifically correct and commercially compelling.

**6. Commercial viability and scientific rigor are the same goal.**  
A platform trusted by Weeks Bay NERR scientists is a platform that sells to BCEDA site selectors. Build for the scientists, sell to everyone.

---

## Repository Structure

```
Terrawatch-/
├── src/
│   ├── pages/               # 20 page components (one per route)
│   ├── components/
│   │   ├── Common/          # StatCard, PageHeader, RiskBadge, Spinner, AlertBanner, etc.
│   │   ├── Charts/          # DOChart, HABProbabilityChart, WeatherForecastChart, etc.
│   │   └── Layout/          # Sidebar nav (22 links, DataStream badge, 4 NEW badges)
│   ├── store/
│   │   └── index.js         # Zustand store + all API fetchers (incl. flood/beach/climate/pollution)
│   ├── App.jsx              # React Router with nested Layout routes
│   ├── main.jsx             # React entry point
│   └── index.css            # Tailwind + glassmorphism custom classes
├── server/
│   ├── index.js             # Express entry (port 3001, alert engine, nightly retrain cron)
│   ├── routes/              # 13 route files
│   ├── services/            # 16 service files covering all 51 data sources
│   └── ml/                  # 6 ML files (Phase 1–3+ algorithms)
├── data/
│   └── terrawatch.db        # sql.js SQLite (auto-created on first run)
├── dist/                    # Vite production build output
├── vite.config.js           # Port 5000; /api proxy → :3001
├── tailwind.config.js       # Bay palette (glassmorphism greens)
├── package.json             # ESM monorepo; concurrently for dev
└── README.md
```

---

## Contact

**Max A. Hansen IV**  
Hansen Holdings · Fairhope, Baldwin County, Alabama  
Platform: TERRAWATCH Environmental Intelligence  
Repository: [github.com/maxhiv/Terrawatch-](https://github.com/maxhiv/Terrawatch-)  
Mission: Give the world eyes on its ecosystems.

---

*TERRAWATCH v2.2 — Built in Fairhope, Alabama. For Mobile Bay and the Gulf Coast.*
