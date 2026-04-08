# TERRAWATCH v2.2

Planetary Environmental Intelligence Platform — Mobile Bay & Gulf Coast

Full documentation: [docs/replit.md](docs/replit.md)

## Architecture

- **Frontend**: React 18 + Vite (`apps/web/`, port 5000)
- **Backend**: Express.js API (`apps/api/`, port 3001)
- **Shared**: `@terrawatch/shared` (`packages/shared/`) — 152-key feature vector
- **Database**: SQLite via sql.js (`data/terrawatch.db`)
- **ML Pipeline**: Phase 1 LogReg → Phase 2 RF+SHAP → Phase 3 CNN-LSTM (Vertex AI)
- **Styling**: Tailwind CSS, glassmorphism theme, bay-* palette
- **Package manager**: npm workspaces

## Project Structure

```
apps/web/          @terrawatch/web — React frontend (23 routes)
apps/api/          @terrawatch/api — Express backend (products/core/routes + services/ingest + ml/)
packages/shared/   @terrawatch/shared — FEATURE_KEYS (152), FEATURE_DEFAULTS
infra/             Docker Compose (api + web + gateway), Cloud Run single-image
docs/              Full README, architecture.md, replit.md (detailed reference)
_legacy/           Quarantined pre-monorepo files
```

## Running

```bash
npm run dev           # Both frontend (5000) and backend (3001) via concurrently
npm run dev:client    # Frontend only
npm run dev:server    # Backend only
npm run build         # Vite production build → dist/
```

## Key Files

- `apps/api/src/index.js` — Entry point, cron jobs, boot
- `apps/api/src/app.js` — createApp() Express factory
- `apps/api/src/products/core/routes/` — All API route handlers
- `apps/api/src/products/core/services/ingest/` — 14 data source fetchers
- `apps/api/src/products/core/services/features/` — crossSensor, mlTrainer, metricsAggregator
- `apps/api/src/ml/shared/featureVector.js` — Re-exports from @terrawatch/shared
- `apps/api/src/data/database.js` — SQLite via sql.js
- `apps/web/src/App.jsx` — Router (23 routes)
- `apps/web/src/store/index.js` — Zustand store

## Cron Tiers

- **3min**: USGS, CO-OPS, NERRS, HF Radar, AirNow, GOES DB, NDBC, NWS
- **20min**: Satellite, Ocean, Ecology, AirPlus, WQP
- **6hr**: Land-Reg, AHPS, NCEI, SSURGO, FEMA
- **Daily 8AM**: ML retrain
- **Poller**: 9 additional sources via EventEmitter
