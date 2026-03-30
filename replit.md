# TERRAWATCH v2.0

Planetary Environmental Intelligence Platform — Mobile Bay & Gulf Coast

## Architecture

- **Frontend**: React 18 + Vite (port 5000, host 0.0.0.0)
- **Backend**: Express.js API (port 3001, localhost)
- **Package manager**: npm
- **Runtime**: Node.js 20

## Project Structure

```
terrawatch/
├── src/                    # React frontend
│   ├── pages/              # Dashboard, WaterQuality, HabOracle, Sensors, WetlandAI
│   ├── App.jsx             # Router + Sidebar
│   ├── main.jsx            # React entry point
│   ├── store.js            # Zustand state
│   └── index.css           # Tailwind base styles
├── server/                 # Express API
│   ├── index.js            # Server entry point (port 3001)
│   ├── routes/             # waterQuality, habOracle, weather, alerts, sensors, ai
│   ├── services/           # usgs.js, noaa.js (external API integrations)
│   └── ml/                 # habOracle.js (HAB Oracle algorithm)
├── index.html              # Vite HTML entry
├── vite.config.js          # Vite config (port 5000, proxy /api → :3001)
├── tailwind.config.js      # Tailwind config
├── postcss.config.js       # PostCSS config
└── package.json            # Monorepo scripts
```

## Running

```bash
npm run dev           # Starts both frontend (5000) and backend (3001) with concurrently
npm run dev:client    # Frontend only
npm run dev:server    # Backend only
npm run build         # Vite production build
```

## Free Data Sources (No Keys Required)

- USGS NWIS — water quality and streamflow
- NOAA CO-OPS — tidal data and water levels
- NOAA NWS — weather forecasts and alerts
- NOAA NDBC — offshore buoy data

## Optional API Keys

- `ANTHROPIC_API_KEY` — enables the AI Field Assistant (`/api/ai/query`)

## Key Features

- **Dashboard**: Weather conditions, 7-day forecast, active data sources
- **Water Quality**: Real-time USGS NWIS + NOAA CO-OPS + NDBC data
- **HAB Oracle**: Pre-bloom harmful algal bloom prediction (48-72h, World First™)
- **Sensors**: Registry of all data feed integrations
- **WetlandAI**: Wetland pre-delineation module (pending Vexcel integration)

## Notes

This project was imported from GitHub. The original repository had scrambled/renamed files
due to a GitHub export artifact. The project has been reconstructed into a proper directory
structure with `src/` for frontend and `server/` for backend.
