import express from 'express';
import { computeAllMetrics } from '../services/features/metricsAggregator.js';

const router = express.Router();

let cache = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getCachedMetrics(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cache && (now - cacheTime) < CACHE_TTL_MS) {
    return { ...cache, cache_hit: true };
  }
  const fresh = await computeAllMetrics();
  cache     = fresh;
  cacheTime = now;
  return { ...fresh, cache_hit: false };
}

export function invalidateMetricsCache() {
  cacheTime = 0;
}

router.use((req, res, next) => {
  const allowed = [
    'https://terrawatch.io',
    'https://www.terrawatch.io',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5000',
  ];
  const origin = req.headers.origin;
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

router.get('/stream', async (req, res) => {
  res.setHeader('Content-Type',        'text/event-stream');
  res.setHeader('Cache-Control',       'no-cache');
  res.setHeader('Connection',          'keep-alive');
  res.setHeader('X-Accel-Buffering',   'no');

  const origin = req.headers.origin;
  const allowed = ['https://terrawatch.io', 'https://www.terrawatch.io', 'http://localhost:3000', 'http://localhost:5173'];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);

  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const data = await getCachedMetrics();
    send('metrics', data);
  } catch (err) {
    send('error', { message: err.message });
  }

  const interval = setInterval(async () => {
    try {
      invalidateMetricsCache();
      const data = await getCachedMetrics();
      send('metrics', data);
    } catch (err) {
      send('error', { message: err.message });
    }
  }, CACHE_TTL_MS);

  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);

  req.on('close', () => {
    clearInterval(interval);
    clearInterval(heartbeat);
  });
});

router.get('/', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === '1';
    const data = await getCachedMetrics(forceRefresh);
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(data);
  } catch (err) {
    console.error('[Metrics] Error:', err.message);
    res.status(500).json({ error: 'Failed to compute metrics', message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const data   = await getCachedMetrics();
    const metric = data.metrics?.[req.params.id];
    if (!metric) return res.status(404).json({ error: `Unknown metric: ${req.params.id}` });
    res.json(metric);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
