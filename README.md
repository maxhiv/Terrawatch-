# TERRAWATCH — Environmental Intelligence Platform

> **Give the world eyes on its ecosystems.**

Real-time environmental monitoring, HAB/hypoxia prediction, industrial site intelligence, and wetland pre-delineation for Mobile Bay and the Gulf Coast of Alabama.

**Owner:** Max A. Hansen IV — Hansen Holdings, Fairhope, Alabama  
**Build origin:** March 28, 2026  
**Current version:** v2.0.0  
**Repository:** `terrawatch-v2` (master branch)  
**Status:** 🟢 LIVE — 22 active sensor feeds, TERRAWATCH Intelligence Phase 1 active

---

## Table of Contents

1. [Mission & Origin](#1-mission--origin)
2. [Three-Product Architecture](#2-three-product-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Application Routes & Pages](#4-application-routes--pages)
5. [Server API Structure](#5-server-api-structure)
6. [Data Sources — 52 Free Feeds](#6-data-sources--52-free-feeds)
7. [GOES-19 Ground Station Integration](#7-goes-19-ground-station-integration)
8. [ML Architecture — Phase Progression](#8-ml-architecture--phase-progression)
9. [HAB Oracle — Feature Engineering](#9-hab-oracle--feature-engineering)
10. [Intelligence Engine & Continuous Learning](#10-intelligence-engine--continuous-learning)
11. [WetlandAI — Remote Pre-Delineation](#11-wetlandai--remote-pre-delineation)
12. [SITEVAULT — Industrial Site Intelligence](#12-sitevault--industrial-site-intelligence)
13. [Environment Variables Reference](#13-environment-variables-reference)
14. [Cron Schedule](#14-cron-schedule)
15. [Deployment](#15-deployment)
16. [Getting Started — Local Development](#16-getting-started--local-development)
17. [Known Gaps & Roadmap](#17-known-gaps--roadmap)
18. [Grant Strategy](#18-grant-strategy)
19. [Architecture Principles](#19-architecture-principles)

---

## 1. Mission & Origin

TERRAWATCH began on March 28, 2026 — the night before a scheduled meeting with a staff scientist in Fairhope, Alabama. The initial prompt was simple: build a custom application to compile and monitor real-time environmental data for Mobile Bay.

What existed before TERRAWATCH was a fragmentation problem: a biologist at Weeks Bay NERR had to visit six separate government websites to understand what was happening in her own estuary. USGS, NOAA CO-OPS, EPA AQS, ADPH shellfish programs, and NERRS CDMO all operated in complete isolation. TERRAWATCH was conceived as the **fusion layer** — the intelligence surface that no single agency could justify building for itself.

Within 48 hours of the first prototype, the project had evolved into a three-product SaaS platform with:
- A machine learning foundation with a continuous learning pipeline
- Full production React + Vite + Express application
- Real API integrations against 22+ live federal data systems
- A satellite imagery strategy using NASA PACE OCI and Copernicus Sentinel
- An auto-labeling intelligence engine accumulating training data toward Phase 3 CNN-LSTM on Vertex AI

**The mission:** Build the environmental intelligence platform that serves shellfish managers, state regulators, municipal governments, commercial fisheries, research institutions, and industrial site selectors with one integrated, defensible, explainable system.

---

## 2. Three-Product Architecture

All three products share a single data infrastructure, cron scheduler, sensor registry, and ML pipeline. Revenue diversification is structural, not bolt-on.

```
┌─────────────────────────────────────────────────────────────┐
│                   SHARED DATA INFRASTRUCTURE                │
│  22 sensor feeds · GOES-19 push API · ML pipeline          │
│  sql.js time-series DB · Zustand global store              │
└──────────────┬────────────────┬───────────────┬─────────────┘
               │                │               │
       ┌───────▼──────┐  ┌──────▼──────┐  ┌────▼──────────┐
       │  TERRAWATCH  │  │  SITEVAULT  │  │   WetlandAI   │
       │    Core      │  │             │  │               │
       │              │  │ Industrial  │  │ Remote wetland│
       │ HAB Oracle   │  │    site     │  │ pre-delineation│
       │ Hypoxia      │  │ intelligence│  │ ResNet-50     │
       │ Forecast     │  │ for BCEDA   │  │ U-Net v2      │
       │ Blue Carbon  │  │ & site      │  │ 1m resolution │
       │ Ledger       │  │ selectors   │  │               │
       └──────────────┘  └─────────────┘  └───────────────┘
```

### TERRAWATCH Core
Real-time environmental monitoring SaaS for Mobile Bay and the Gulf Coast. Primary customers: shellfish managers, ADEM state regulators, municipal governments in Baldwin County, recreational fisheries, Dauphin Island Sea Lab, Weeks Bay NERR.

**Core products within TERRAWATCH:**
- HAB Oracle — 68-feature logistic regression HAB probability engine (Phase 1), with CNN-LSTM Phase 3 spec for activation at 2,000 labeled samples
- Hypoxia Forecast — 5-day dissolved oxygen floor forecast with ELEVATED/NORMAL/CRITICAL status
- Blue Carbon Ledger — Spartina alterniflora carbon sequestration accounting with Verra MRV alignment
- Treatment Planner v2.0 — Hybrid drone + USV HAB remediation with dosing calculator and regulatory checklists
- AI Field Assistant — Claude-powered expert environmental Q&A using live sensor readings as context

### SITEVAULT
Industrial site intelligence for the Baldwin County Economic Development Alliance (BCEDA) and industrial site selectors evaluating the Mobile Bay region for manufacturing and logistics investment. SITEVAULT wraps environmental data into a commercial real estate due diligence product: flood risk, environmental compliance history, stormwater management capacity, air quality baselines, and proximity to sensitive ecological zones.

**Target customers:** BCEDA, industrial site selectors, environmental permitting consultants, developers

### WetlandAI
Remote wetland pre-delineation tool for environmental consulting firms, ALDOT, USACE permitting consultants, and developers seeking to understand wetland jurisdiction before expensive in-field surveys. Uses a ResNet-50 U-Net deep learning model trained on NDWI, NDVI, SRTM elevation, and NWI data to produce preliminary wetland boundary maps at 1-meter resolution.

**Target customers:** Environmental consulting firms, ALDOT, USACE permitting consultants, Baldwin County developers

---

## 3. Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND                                                        │
│  React 18 + Vite 5 · Zustand · Tailwind CSS · Recharts         │
│  Leaflet + Esri WorldImagery · React Router v6                  │
├─────────────────────────────────────────────────────────────────┤
│  BACKEND                                                         │
│  Node.js 22 + Express.js · Axios · node-cron                   │
│  sql.js (SQLite via WASM) · CORS · Rate limiting                │
├─────────────────────────────────────────────────────────────────┤
│  ML / INTELLIGENCE                                               │
│  Phase 1: Logistic regression in JavaScript (browser + server)  │
│  Phase 2: Random forest (500 labeled samples) — JS              │
│  Phase 3: CNN-LSTM on Vertex AI (2,000 labeled samples)         │
│  Phase 4: ST-Transformer + Spatio-Temporal GNN                  │
├─────────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE                                                  │
│  Replit (current) · GCP Cloud Run (production target)           │
│  GCP Cloud Build CI/CD · Vertex AI (Phase 3 ML training)        │
│  BigQuery (data pipeline spec) · GitHub: terrawatch-v2          │
└─────────────────────────────────────────────────────────────────┘
```

| Layer | Technology | Purpose |
|---|---|---|
| Frontend framework | React 18 + Vite 5 | Component-based UI, HMR, fast production builds |
| UI state management | Zustand | Global store for all sensor data, loading states, live mode, GOES-19 |
| Styling | Tailwind CSS + custom `bay-*` palette | Utility-first CSS with TERRAWATCH ecological color system |
| Charts | Recharts | Area, line, scatter, bar charts for all time-series data |
| Maps | Leaflet + Esri WorldImagery | Satellite basemap with station markers and NASA GIBS overlays |
| Backend runtime | Node.js 22 + Express.js | REST API server, CORS, rate limiting, scheduled crons |
| Database | sql.js (SQLite via WASM) | Time-series persistence — no native compilation, Replit-compatible |
| HTTP client | Axios | All external API calls with timeout and error handling |
| Scheduling | node-cron | 3-min persistence, hourly HAB Oracle, weekly retraining |
| Build | Vite build | 988 modules transformed, production-optimized bundle |

**Build output:** Zero errors. `npm run build` → 988 modules transformed.

---

## 4. Application Routes & Pages

15 distinct pages via React Router v6, each connected to the Zustand global store and Express REST API.

| Route | Page | Purpose |
|---|---|---|
| `/` | Dashboard | Real-time KPI grid, HAB Oracle summary, NERRS/HF Radar/GOES-19/Intelligence strip |
| `/hab` | HAB Oracle | Full HAB probability gauge, 72-hour outlook, risk factors, data quality panel |
| `/hypoxia` | Hypoxia Forecast | 5-day dissolved oxygen floor forecast, ELEVATED/NORMAL/CRITICAL status |
| `/water` | Water Quality | 4-tab station cards with all USGS + CO-OPS + NERRS parameters |
| `/map` | Satellite Map | Esri WorldImagery + NASA GIBS overlays + color-coded DO₂ station markers |
| `/science` | Science View | 5-tab scientist evaluation: overview, time series, station compare, correlation, export |
| `/intelligence` | Intelligence Engine | Phase 1/2/3 ML pipeline status, DB stats, model history, auto-label events |
| `/sensors` | Sensor Registry | All 22 sensors with auth requirements, feeds, and live status |
| `/feeds` | Feed Status | Mission control for all data feeds with live previews and setup guide |
| `/wetland` | WetlandAI | U-Net v2 wetland pre-delineation with BIOPAR + NERRS validation |
| `/sitevault` | SITEVAULT | Industrial site intelligence for BCEDA and economic development |
| `/alerts` | Alert Center | All active threshold-crossing alerts with severity, station, recommended action |
| `/ml` | ML Architecture v2 | 5-tab deep dive: models, PACE integration, changelog, upgrade queue |
| `/ai` | AI Field Assistant | Claude-powered expert environmental Q&A with live sensor context |
| `/vision` | Vision | Computer vision and satellite imagery analysis interface |

---

## 5. Server API Structure

The Express server exposes seven route groups. All routes prefixed `/api/`.

```
server/
├── index.js                    # Express entry — PORT, CORS, rate limiting, all routes mounted
├── routes/
│   ├── water.js                # /api/water
│   ├── hab.js                  # /api/hab
│   ├── weather.js              # /api/weather
│   ├── alerts.js               # /api/alerts
│   ├── sensors.js              # /api/sensors
│   ├── goes19.js               # /api/goes19
│   ├── intelligence.js         # /api/intelligence
│   ├── ml.js                   # /api/ml
│   └── ai.js                   # /api/ai
└── services/
    ├── waterQuality.js         # USGS NWIS, NOAA CO-OPS, NERRS CDMO
    ├── habOracle.js            # 68-feature HAB Oracle, logistic regression, retraining
    ├── weather.js              # NWS GFS, NDBC buoy, CO-OPS tidal, HF Radar
    ├── satellite.js            # MODIS, VIIRS, HLS, Landsat, Sentinel-2, Copernicus DEM
    ├── ocean.js                # HYCOM, CMEMS, GOES-19 SST, HF Radar currents
    ├── ecology.js              # NERRS, GBIF, iNaturalist, eBird, AmeriFlux
    ├── landRegWeather.js       # FEMA, USACE ORM, NRCS SSURGO, NLCD, NWS GFS
    ├── airQuality.js           # AirNow, EPA AQS, OpenAQ, PurpleAir
    ├── goes19.js               # GOES-19 ingest handler, scalar extraction, ML feature injection
    └── intelligence.js         # Auto-labeling, vector accumulation, training data export
```

### Key endpoints

```
GET  /api/water/realtime                    — All active station readings (USGS + CO-OPS + NERRS)
GET  /api/water/historical/:siteNo/:paramCode
GET  /api/hab/assess                        — Full HAB Oracle assessment (68-feature inference)
GET  /api/hab/probability                   — Current bloom probability 0.0–1.0
GET  /api/hab/risk-factors                  — Ranked contributing risk signals
GET  /api/hab/outlook                       — 72-hour probabilistic outlook
GET  /api/weather/current                   — NWS forecast + NDBC buoy + CO-OPS tidal composite
GET  /api/alerts                            — All active threshold-crossing events
GET  /api/sensors                           — 22-sensor registry with status, feeds, auth requirements
GET  /api/goes19/status                     — GOES-19 integration health + last ingest timestamp
GET  /api/goes19/latest                     — Latest GOES-19 scalar extraction (all 6 product types)
GET  /api/goes19/features                   — 18 GOES-19 ML features injected into feature vector
POST /api/goes19/ingest                     — Ground station push endpoint (GOES19_API_KEY auth)
GET  /api/intelligence/status               — ML phase, DB stats, Phase 3 readiness
POST /api/intelligence/retrain              — Manual retraining trigger
GET  /api/intelligence/vectors              — Feature vector export for external analysis
GET  /api/intelligence/events               — Auto-labeled event log
GET  /api/intelligence/export-training-data — Full labeled dataset export (CSV/JSON)
GET  /api/ml                                — ML Architecture v2 spec, SHAP, PACE HAB signal
POST /api/ai                                — Claude Field Assistant (sends live sensor context)
```

---

## 6. Data Sources — 52 Free Feeds

Organized into five service files. 47 of 52 sources activate with NASA Earthdata + Copernicus credentials alone.

### Tier 1 — Core In-Situ Sensors (always-on, no key required)

| Source | Data | Update interval |
|---|---|---|
| USGS NWIS | Dissolved oxygen, temperature, salinity, turbidity, nitrate, conductance | 15 min |
| NOAA CO-OPS | Water level, salinity, currents, SST, air temp, wind | 6 min |
| NERRS CDMO (Weeks Bay) | Full estuarine suite + meteorology | 15 min |
| NDBC Buoys | Wave height, period, SST, air pressure, wind | 30 min |
| HF Radar | Surface current vectors across Mobile Bay | 1 hour |
| NWS GFS | 7-day atmospheric forecast + rainfall | 6 hours |
| NOAA CO-OPS Tidal | Predicted vs observed tidal stage | Continuous |

### Tier 2 — Satellite (NASA Earthdata + Copernicus)

| Source | Product | Resolution / Revisit |
|---|---|---|
| NASA PACE OCI | Chlorophyll-a, Karenia brevis spectral signature (465–490nm) | 1km / daily |
| MODIS Aqua/Terra | Chlorophyll-a L3M, SST | 1km / daily |
| VIIRS (Suomi-NPP / NOAA-20) | Ocean color, DNB nighttime lights | 375m / daily |
| HLS (Harmonized Landsat-Sentinel) | 30m analysis-ready, ~2-3 day revisit | 30m |
| Landsat 8/9 (USGS) | Multispectral + thermal | 30m / 16-day |
| Sentinel-2 (ESA) | Multispectral NDVI/NDWI | 10m / 5-day |
| Sentinel-5P TROPOMI | CH₄, NO₂, CO, O₃ | 3.5km / daily |
| Copernicus DEM GLO-30 | Digital elevation model | 30m |
| CropSAR 2D | SAR cloud-penetrating vegetation | 10m / daily |
| MOGPR (AI4FOOD) | Gap-filled NDVI/LAI with uncertainty bounds | 10m / daily |
| BIOPAR FAPAR/LAI | Verra-defensible ESA biophysical parameters | 10m |
| WorldCereal (ESA) | Annual crop type map, watershed nitrogen attribution | 10m / annual |
| NASA GIBS | Real-time overlay tiles (MODIS True Color, Chlorophyll) | Streaming |

### Tier 3 — Ocean, Ecology, Regulatory

| Source | Data |
|---|---|
| HYCOM | 3D ocean physics: temperature profiles, currents, salinity vertical structure |
| CMEMS | Copernicus Marine chlorophyll, sea level anomaly, SST |
| GBIF | Biodiversity occurrence records |
| iNaturalist | Community species observations |
| eBird | Waterbird distribution (EBIRD_API_KEY) |
| AmeriFlux | Carbon flux tower data, Weeks Bay ecosystem respiration |
| FEMA NFHL | Flood hazard zone classification |
| USACE ORM | Jurisdictional wetland regulatory data |
| NRCS SSURGO | Soil type, drainage class, hydrologic group |
| NLCD | National Land Cover Database — land use classification |
| EPA ECHO | Industrial discharge permit compliance history |
| EPA ATTAINS | Impaired waterbody assessments |

### Tier 4 — Air Quality

| Source | Data |
|---|---|
| AirNow (no key) | Real-time AQI, PM2.5, O₃ — Dauphin Island |
| EPA AQS | Official monitor network — cross-media atmospheric N deposition |
| OpenAQ | Global community aggregator — hyperlocal gap-fill |
| PurpleAir | 30,000+ community PM2.5 sensors — industrial fence-line detection |

### Tier 5 — GOES-19 Ground Station Push API (5-minute cadence)

See [Section 7](#7-goes-19-ground-station-integration) below.

---

## 7. GOES-19 Ground Station Integration

GOES-19 is the single most impactful sensor upgrade in the TERRAWATCH stack. A partner ground station processes ~40,000 files/day from GOES-19 and pushes scalar extractions to TERRAWATCH via a custom API every 5 minutes.

**AOI:** 29.8°N–31.2°N, 87.3°W–89.0°W (Mobile Bay region)  
**Volume:** ~288 pushes/day, <2KB per payload, <600KB total daily transfer

### Six product types ingested

| Product | TERRAWATCH application | ML feature priority |
|---|---|---|
| SST (Bands 7+13) | Thermal stratification — SST gradient >3.5°C precedes DO₂ crash by 6–24h | CRITICAL |
| QPE rainfall rate | Nutrient pulse trigger — N/P mobilization 48–96h lag before bloom | HIGH |
| Cloud mask (Band 2) | Satellite scheduler — flags PACE/Sentinel acquisition windows | HIGH |
| True color + band ratios | Surface bloom detection — green/red ratio every 5 min | HIGH |
| GLM lightning | Convective mixing events — temporary DO₂ rise before post-storm rebound | MEDIUM |
| AMV winds | Bloom transport verification — cross-ref with HF Radar for Lagrangian tracking | MEDIUM |

### Integration files

```
server/services/goes19.js       # Scalar extraction, product parsing, ML feature construction
server/routes/goes19.js         # POST /api/goes19/ingest, GET /status, /latest, /history, /features
```

The GOES-19 ingest adds **18 new ML features** directly into the HAB Oracle feature vector, bringing the total from 50 → 68. Auth via `GOES19_API_KEY` (shared secret with ground station operator).

---

## 8. ML Architecture — Phase Progression

```
PHASE 0 (now)   → Accumulate labeled samples via auto-labeling engine
PHASE 1 (active)→ Logistic regression, 68-feature vector, ~800 epochs, L2 regularization, JS
PHASE 2         → Random forest (500 labeled samples) — still JavaScript
PHASE 3         → CNN-LSTM on Vertex AI (2,000 labeled samples threshold)
PHASE 4         → ST-Transformer + Spatio-Temporal GNN + Physics-Informed RNN
```

### Phase 1 — HAB Oracle (Current)

- **Algorithm:** Logistic regression with L2 regularization
- **Runtime:** JavaScript (browser + server, no Python dependency in Phase 1)
- **Feature vector:** 68 dimensions (50 base environmental + 18 GOES-19 injected)
- **Training:** ~800 epochs on accumulated auto-labeled events
- **Output:** Bloom probability 0.0–1.0, risk factor ranking, 72-hour outlook
- **Retraining:** Weekly cron (Sunday midnight), AUC-ROC evaluated, auto-promotes if improved

### Phase 3 — CNN-LSTM (Vertex AI)

**Activation threshold:** 2,000 labeled samples  
**Architecture:**

```
Input tensor: [time_steps=72, features=68] per sample
→ CNN layers: 1D convolutions for local pattern extraction (chlorophyll spikes, SST gradients)
→ LSTM layers: Long-term temporal dependencies (multi-day precursor signals)
→ Attention: Weighted feature importance for SHAP interpretability
→ Output: HAB probability + uncertainty quantification
```

**Explainability:** SHAP values at inference — required for EPA grant defensibility and regulatory credibility with ADEM scientists.

### Phase 4 — Planned Architecture

| Model | Target | Capability |
|---|---|---|
| ST-Transformer | Hypoxia spatial prediction | Spatio-temporal attention across sensor network |
| Spatio-Temporal GNN | Sensor network topology | Graph neural network over bay station graph |
| Physics-Informed RNN (PI-RNN) | Gap-filling | Embeds advection-diffusion PDEs as physics constraints |

**PINNs rationale:** Physics-Informed Neural Networks embed the advection-diffusion PDEs governing nutrient transport as hard constraints in the network loss function. This ensures model outputs remain physically consistent during sensor outages and satellite cloud gaps — a hard requirement for scientific defensibility with Weeks Bay NERR and DISL reviewers.

---

## 9. HAB Oracle — Feature Engineering

The 68-feature vector covers five observational domains:

### Domain 1 — Water Column (in-situ, real-time)
Dissolved oxygen (mg/L, % saturation), water temperature, salinity, turbidity, nitrate, conductance, pH, chlorophyll fluorescence, phycocyanin.

### Domain 2 — Hydrological (watershed forcing)
River discharge (Mobile-Tensaw delta inflows), tidal stage, rainfall accumulation (1-day, 3-day, 7-day lag), stormwater runoff index, nutrient load proxy.

### Domain 3 — Atmospheric
Wind speed, wind direction, atmospheric pressure, air temperature, dew point, cloud cover index, UV index.

### Domain 4 — Satellite-derived
MODIS chlorophyll-a (1km), VIIRS ocean color, PACE OCI chlorophyll + Karenia spectral index, NDVI/NDWI for upstream vegetation stress, MOGPR gap-filled NDVI.

### Domain 5 — GOES-19 Injected Features (18 features)
SST bay mean, SST gradient (spatial), SST thermal stratification index, rainfall rate, cumulative QPE 1h/3h/6h, cloud mask (bay clear %), bloom index (band ratio), GLM lightning strike density, AMV wind speed/direction anomaly, SST anomaly vs 30-day mean, SST rate of change, convective instability index.

### Known Observational Blindness Types

Four identified architectural challenges in HAB Oracle sensor coverage:

1. **Optical cloud cover** — PACE/Sentinel blocked by Gulf Coast summer cloud cover (solved by GOES-19 thermal + CropSAR SAR cloud-penetration)
2. **Spatial gaps** — sparse in-situ sensor network across a 400 sq-mi bay (solved by spatial interpolation + Sentinel-2 derived chlorophyll)
3. **Subsurface blindness** — no vertical DO profile sensors (solved by HYCOM physics model integration + Kalman filter data assimilation)
4. **Upstream/offshore precursor gaps** — bloom initiates offshore or in watershed before reaching monitored zones (solved by GOES-19 5-min SST, HF Radar, upstream river gauges)

---

## 10. Intelligence Engine & Continuous Learning

The Intelligence Engine is the continuous learning backbone of TERRAWATCH. It auto-labels events, accumulates training data, and manages phase transitions.

### Auto-labeling pipeline

The engine watches all incoming sensor reads and auto-labels six event types:

| Event type | Labeling rule | Signal |
|---|---|---|
| HAB precursor | Chlorophyll-a ↑ + DO ↓ + wind shift | Bloom initiation signal |
| Hypoxia event | DO < 4.0 mg/L sustained | Hypoxic threshold crossing |
| SST stratification | Vertical ΔT > 3.5°C (GOES-19) | Pre-hypoxia thermal structure |
| Nutrient pulse | QPE > threshold + river discharge spike | Watershed N/P loading event |
| Bloom active | Chlorophyll-a > bloom threshold + PACE confirmation | Confirmed bloom |
| Convective mixing | GLM lightning density + DO bounce | Storm mixing event |

### Database schema (sql.js / SQLite)

```sql
sensor_readings     — Raw ingested values (all 22 sources, all parameters)
feature_vectors     — 68-dimension ML input snapshots (one per 3-min tick)
hab_events          — Auto-labeled bloom/hypoxia/precursor events
retrain_log         — Weekly retrain history: AUC-ROC, accuracy, training N, timestamp
goes19_ingest       — GOES-19 raw scalar extractions (all 6 product types)
model_registry      — Deployed model versions with performance metrics
```

### Phase 3 activation checklist

- [ ] 2,000 accumulated feature vectors
- [ ] 200 confirmed labeled samples (auto-labeled or human-confirmed)
- [ ] `GCP_PROJECT` secret configured
- [ ] `VERTEX_SERVICE_ACCOUNT_KEY` secret configured
- [ ] Phase 3 activation banner triggers in `/intelligence` page

---

## 11. WetlandAI — Remote Pre-Delineation

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
```

### Products

- Preliminary wetland boundary maps (1m resolution)
- Jurisdictional wetland probability surface
- Pre-survey risk screening reports for permitting consultants
- Blue carbon biomass estimation (Spartina alterniflora mapping with ESA BIOPAR)

### Target markets

AL, FL, MS environmental consulting firms, ALDOT, USACE permitting consultants, Baldwin County developers requiring 404/401 permit pre-screening.

---

## 12. SITEVAULT — Industrial Site Intelligence

SITEVAULT packages the TERRAWATCH sensor network and regulatory data into a commercial real estate due diligence product for economic development organizations and industrial site selectors.

### Data layers

| Layer | Sources | Customer value |
|---|---|---|
| Flood risk | FEMA NFHL, GOES-19 QPE, USGS gauge data | Industrial facility flood exposure scoring |
| Environmental compliance | EPA ECHO discharge permits + violations | Regulatory liability screening |
| Air quality baseline | EPA AQS, AirNow, PurpleAir | Facility siting air quality context |
| Ecological proximity | WetlandAI boundary, USACE ORM, NWI | 404 permit risk proximity analysis |
| Stormwater capacity | NRCS SSURGO, NLCD impervious, FEMA SFHA | MS4 compliance capacity |
| HAB/hypoxia risk | HAB Oracle, Hypoxia Forecast | Water intake risk for industrial users |

### Key stakeholder

**Baldwin County Economic Development Alliance (BCEDA)** — primary institutional target, existing relationship via Lee Lawson.

---

## 13. Environment Variables Reference

All secrets managed as Replit Secrets (environment variables). Production: GCP Secret Manager.

| Secret | Source | What it activates |
|---|---|---|
| `NASA_EARTHDATA_USER` | urs.earthdata.nasa.gov (free) | NASA PACE OCI, MODIS, VIIRS, HLS, Landsat via CMR |
| `NASA_EARTHDATA_PASS` | urs.earthdata.nasa.gov (free) | Same account |
| `COPERNICUS_USER` | dataspace.copernicus.eu (free) | Sentinel-5P TROPOMI, openEO algorithms, CropSAR |
| `COPERNICUS_PASS` | dataspace.copernicus.eu (free) | Same account |
| `AIRNOW_API_KEY` | docs.airnowapi.org (free) | Real-time AQI — PM2.5, O₃, NO₂, CO |
| `AQS_EMAIL` + `AQS_API_KEY` | aqs.epa.gov/data/api/signup | EPA AQS official monitor network |
| `NCEI_API_KEY` | ncdc.noaa.gov/cdo-web/token | NOAA NCEI climate records |
| `EBIRD_API_KEY` | ebird.org/api/keygen | eBird waterbird distribution |
| `PURPLEAIR_API_KEY` | develop.purpleair.com | PurpleAir 30k+ community PM2.5 sensors |
| `AMERIFLUX_TOKEN` | ameriflux.lbl.gov/data/register-data-usage | Carbon flux tower data |
| `GOES19_API_KEY` | Internal — generate secure string | Authenticates GOES-19 ground station push |
| `ANTHROPIC_API_KEY` | console.anthropic.com (paid) | AI Field Assistant — Claude Q&A with live sensor context |
| `GCP_PROJECT` | console.cloud.google.com | Phase 3 Vertex AI training job submission |
| `VERTEX_SERVICE_ACCOUNT_KEY` | GCP IAM service account JSON | Phase 3 Vertex AI authentication |
| `VEXCEL_API_KEY` | vexceldata.com/contact (evaluation) | 7.5cm ortho imagery + 50cm DTM for WetlandAI |

**Currently configured:** `NASA_EARTHDATA_USER+PASS`, `COPERNICUS_USER+PASS`, `AIRNOW_API_KEY` — activates 47 of 52 sources.

**Pending registration:** `AQS_EMAIL+AQS_API_KEY`, `NCEI_API_KEY`, `EBIRD_API_KEY`, `PURPLEAIR_API_KEY`, `AMERIFLUX_TOKEN` — all free, most instant.

---

## 14. Cron Schedule

All crons managed by `node-cron` in `server/index.js`.

| Schedule | Job | What it does |
|---|---|---|
| Every 3 minutes | `persistTick()` | Fetch all 22 sensor feeds → write `sensor_readings` + `feature_vector` + `hab_events` |
| Every hour | HAB Oracle log | HAB Oracle assessment logged, prepared for intelligence feedback loop |
| Every 10 minutes | `saveDB()` | Checkpoint sql.js in-memory database to `data/terrawatch.db` |
| Sunday midnight | `retrainHABOracle()` | Weekly retrain, AUC-ROC evaluation, auto-promote if improved, write `retrain_log` |

---

## 15. Deployment

### Current: Replit

- Persistent file storage, environment secrets management
- Always-on Node.js hosting
- `data/terrawatch.db` persists across restarts

### Production target: GCP Cloud Run

```bash
# Build
npm run build                          # Vite builds to /dist — 988 modules

# Server start
node server/index.js                   # Express on PORT env var (default 3001)

# Frontend served
/dist in production                    # Vite dev server in development
```

**GCP stack:**
- Cloud Run — containerized Express server
- Cloud Build — CI/CD from GitHub `master` branch
- Vertex AI — Phase 3 CNN-LSTM training jobs
- BigQuery — data pipeline (specified, not yet deployed)
- Secret Manager — all env vars in production

### Docker (Cloud Run)

```dockerfile
FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["node", "server/index.js"]
```

---

## 16. Getting Started — Local Development

### Prerequisites

- Node.js 22+
- npm 10+
- Git

### Install

```bash
git clone https://github.com/[org]/terrawatch-v2.git
cd terrawatch-v2
npm install
```

### Configure environment

```bash
cp .env.example .env
# Edit .env — at minimum add NASA_EARTHDATA_USER + PASS and COPERNICUS_USER + PASS
# This activates 47 of 52 data sources
```

### Run development

```bash
# Terminal 1 — Backend
node server/index.js

# Terminal 2 — Frontend
npm run dev
```

Frontend runs at `http://localhost:5173`, proxies API calls to Express on port 3001.

### Build for production

```bash
npm run build
# /dist is the production frontend bundle
# Serve with: node server/index.js (serves /dist in production mode)
```

### Database

The database is `data/terrawatch.db` — created automatically on first run. No migrations required. Schema is initialized in `server/services/intelligence.js`.

---

## 17. Known Gaps & Roadmap

Four product gaps identified where all required data is already ingested. These are **product layer builds**, not data engineering work.

### Gap 1 — Compound Flood Intelligence Engine ⚡ HIGH PRIORITY

**Status:** Data ingested (GOES-19 QPE, USGS gauges, FEMA NFHL, NWS GFS, NOAA tidal, storm surge model). No unified flood risk surface.

**Build:** Single unified compound flood score per location: coastal surge + riverine + pluvial contributing factors with 24/48/72h probability forecast.

**Market:** Municipal emergency management, BCEDA site risk, Baldwin County flood insurance contexts.

### Gap 2 — Beach & Water Safety Scorer ⚡ HIGH PRIORITY

**Status:** Data present (HAB Oracle probability, DO readings, AirNow AQI, EPA ATTAINS beach closure history, NWS forecast). No consumer product layer.

**Build:** Single A–F letter grade per beach/water access point, updated daily. Mobile Bay beaches + Eastern Shore + Gulf Shores.

**Market:** Tourism, recreational fisheries, public health, Baldwin County municipalities.

### Gap 3 — Climate Vulnerability Index

**Status:** Inputs exist (FEMA NFHL, GOES-19 SST trend, NLCD impervious, SSURGO drainage, census demographics). No scored parcel-level output.

**Build:** Parcel-level climate vulnerability score combining flood exposure, heat island intensity, drainage capacity, and social vulnerability index.

**Market:** Baldwin County planning, insurance, federal CDBG-DR grant compliance.

### Gap 4 — Industrial Pollution Tracker (full chain)

**Status:** PFAS Source Attribution exists. Broader source-to-waterbody chain product does not.

**Build:** Unified source-to-waterbody pollution chain: facility discharge (EPA ECHO) → watershed transport model → impaired waterbody (EPA ATTAINS) → shellfish closure attribution.

**Market:** Environmental justice litigation support, ADEM, MBNEP watershed management.

---

## 18. Grant Strategy

Grants are scientific validation infrastructure that make every commercial sale easier. A NOAA-funded platform is a peer-reviewed platform.

| Grant | Award size | Timeline | Role |
|---|---|---|---|
| Hatch Fairhope Foundation | $36,000 | Apply now | PI (private company eligible) |
| NERRS Science Collaborative | $100K–$300K | LOI Month 2 | Subcontractor / co-PI |
| Mississippi-Alabama Sea Grant | $50K–$150K | Pre-proposal Month 3 | Subcontractor |
| NOAA HABHRCA | $200K–$500K | Full proposal Month 6 | Subcontractor |
| EPA National Estuary Program | $50K–$200K | Year 1–2 | Subcontractor |
| RESTORE Act | $100K–$500K | Year 2 | Subcontractor |
| NSF EarthCube / Convergence | $200K–$1M | Year 2 | Co-PI eligible |
| NOAA SBIR Phase I + II | $150K–$1.5M | Year 2 | PI (private company required) |

**Regulatory defensibility requirements:**
- SHAP explainability at inference — built into Phase 3 spec
- Physics-Informed Neural Networks for gap-filling — scientifically defensible outputs during sensor outages
- AUC-ROC tracked at every retrain cycle — written to `retrain_log` and exposed at `/intelligence`

---

## 19. Architecture Principles

These are the design decisions that make TERRAWATCH defensible to EPA grant officers, explainable to PhD scientists, and meaningful to fishing communities.

**1. Data fusion creates intelligence no single source achieves alone.**  
The HAB Oracle is only possible because GOES-19 thermal, USGS discharge, NERRS chlorophyll, and PACE spectral data are fused into one feature vector. No single agency can see what TERRAWATCH can see.

**2. Observational blindness is a first-class problem, not an edge case.**  
Four identified blindness types are tracked explicitly. Each has a named mitigation strategy. Acknowledging uncertainty honestly is what makes the platform trusted.

**3. Explainability is not optional.**  
SHAP values at inference are required for every grant submission and every conversation with an ADEM regulator. Black-box models don't get deployed here.

**4. Physics must constrain the ML.**  
PINNs embedding advection-diffusion PDEs ensure model outputs remain physically plausible during data gaps. The bay doesn't violate the laws of physics when a sensor goes offline — neither should our forecasts.

**5. Commercial viability and scientific rigor are the same goal.**  
A platform trusted by Weeks Bay NERR scientists is a platform that sells to BCEDA site selectors. Build for the scientists, sell to everyone.

---

## Repository Structure

```
terrawatch-v2/
├── src/
│   ├── components/          # Shared React components
│   ├── pages/               # 15 page components (one per route)
│   ├── store/               # Zustand global store + all fetchers
│   └── main.jsx             # React Router entry
├── server/
│   ├── index.js             # Express entry, cron init, all routes mounted
│   ├── routes/              # 9 route files
│   └── services/            # 10 service files covering all 52 data sources
├── data/
│   └── terrawatch.db        # sql.js SQLite database (auto-created)
├── public/                  # Static assets
├── dist/                    # Vite production build output (gitignored)
├── vite.config.js           # Vite configuration + API proxy
├── tailwind.config.js       # Tailwind + bay-* color palette
├── package.json
└── README.md
```

---

## Contact

**Max A. Hansen IV**  
Hansen Holdings · Fairhope, Baldwin County, Alabama  
Platform: TERRAWATCH Environmental Intelligence  
Mission: Give the world eyes on its ecosystems.

---

*TERRAWATCH v2.0.0 — Built in Fairhope, Alabama. For Mobile Bay and the Gulf Coast.*
