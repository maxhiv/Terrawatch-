import { EventEmitter } from 'events'
import { DATA_SOURCES, fetchAllSources } from '../services/dataSources/index.js'
import { saveSnapshot, saveRiskFlags } from '../services/database.js'

export const pollerEvents = new EventEmitter()

const intervals = new Map()
let isRunning   = false
let fullSnapshotHandle = null

export function startPoller() {
  if (isRunning) return
  isRunning = true

  console.log('[Poller] Starting TERRAWATCH data source poller...')

  for (const source of DATA_SOURCES) {
    setTimeout(() => runSourceFetch(source), Math.random() * 10000)

    const handle = setInterval(
      () => runSourceFetch(source),
      source.poll_interval_min * 60 * 1000
    )

    intervals.set(source.id, handle)
    console.log(`[Poller]   ${source.label} — every ${source.poll_interval_min}min`)
  }

  fullSnapshotHandle = setInterval(emitFullSnapshot, 5 * 60 * 1000)
}

export function stopPoller() {
  for (const [id, handle] of intervals) {
    clearInterval(handle)
  }
  intervals.clear()
  if (fullSnapshotHandle) {
    clearInterval(fullSnapshotHandle)
    fullSnapshotHandle = null
  }
  isRunning = false
}

async function runSourceFetch(source) {
  const t0 = Date.now()

  try {
    const data     = await source.fetch()
    const elapsed  = Date.now() - t0

    const snapshot = {
      source_id:   source.id,
      label:       source.label,
      category:    source.category,
      timestamp:   new Date().toISOString(),
      elapsed_ms:  elapsed,
      data,
      flags:       extractFlags(data),
    }

    saveSnapshot(snapshot).catch(e =>
      console.error(`[Poller] DB save error (${source.id}):`, e.message)
    )

    if (snapshot.flags.length > 0) {
      saveRiskFlags(snapshot.flags.map(f => ({
        source_id:  source.id,
        flag:       f.flag,
        context:    f.context ?? null,
        timestamp:  snapshot.timestamp,
      }))).catch(e =>
        console.error(`[Poller] Risk flag save error (${source.id}):`, e.message)
      )
    }

    pollerEvents.emit('source_update', snapshot)

    if (snapshot.flags.length > 0) {
      pollerEvents.emit('flags_raised', { source_id: source.id, flags: snapshot.flags })
    }

    console.log(`[Poller] ✓ ${source.label} (${elapsed}ms) — ${snapshot.flags.length} flags`)

  } catch (err) {
    console.error(`[Poller] ✗ ${source.label}: ${err.message}`)
    pollerEvents.emit('source_error', { source_id: source.id, error: err.message })
  }
}

async function emitFullSnapshot() {
  try {
    const snapshot = await fetchAllSources()
    pollerEvents.emit('snapshot', snapshot)
  } catch (err) {
    console.error('[Poller] Full snapshot error:', err.message)
  }
}

export async function triggerSourceRefresh(sourceId) {
  const source = DATA_SOURCES.find(s => s.id === sourceId)
  if (!source) throw new Error(`Unknown source: ${sourceId}`)
  await runSourceFetch(source)
}

function extractFlags(data) {
  const flags = []

  if (!data) return flags

  if (Array.isArray(data.flags)) {
    flags.push(...data.flags.map(f => ({ flag: f, context: null })))
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      if (Array.isArray(item.flags)) {
        flags.push(...item.flags.map(f => ({
          flag:    f,
          context: item.name ?? item.station_id ?? item.buoy_id ?? null,
        })))
      }
    }
  }

  return flags
}
