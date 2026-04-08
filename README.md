# TERRAWATCH v2.2

> **Give the world eyes on its ecosystems.**

Planetary environmental intelligence platform for Mobile Bay & the Gulf Coast of Alabama.
Real-time HAB/hypoxia prediction, compound flood intelligence, beach safety scoring,
and 152-key ML feature vector from 24+ live federal data sources.

## Monorepo Layout

| Path | Description |
|---|---|
| `apps/web/` | React 18 + Vite frontend (`@terrawatch/web`) |
| `apps/api/` | Express.js API server (`@terrawatch/api`) |
| `packages/shared/` | Shared constants — 152-key feature vector (`@terrawatch/shared`) |
| `infra/` | Docker Compose, Nginx gateway, Cloud Run Dockerfile |
| `docs/` | Full README, architecture docs, Replit config reference |
| `_legacy/` | Quarantined pre-monorepo files (safe to ignore) |

## Quick Start

```bash
npm install
npm run dev        # Frontend (port 5000) + API (port 3001) via concurrently
npm run build      # Vite production build → dist/
```

See [docs/README.md](docs/README.md) for the full platform documentation.
See [docs/architecture.md](docs/architecture.md) for container topology and ML pipeline details.
