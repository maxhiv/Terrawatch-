import { EventEmitter } from 'events'
import { DATA_SOURCES, computeHABRiskScore } from '../services/dataSources/index.js'
import { saveSnapshot, saveRiskFlags, getLatestSnapshots, getRecentRiskFlags } from '../services/database.js'

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

    await saveSnapshot(snapshot)

    if (snapshot.flags.length > 0) {
      await saveRiskFlags(snapshot.flags.map(f => ({
        source_id:  source.id,
        flag:       f.flag,
        context:    f.context ?? null,
        timestamp:  snapshot.timestamp,
      })))
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

function dedupFlagsForEmit(flags) {
  const seen = new Set()
  return flags.filter(f => {
    const ts = new Date(f.timestamp).getTime()
    const key = `${f.flag}|${f.source_id}|${Math.floor(ts / 3600000)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function getHABProbForSnapshot() {
  try {
    const port = process.env.PORT || 3001
    const res = await fetch(`http://localhost:${port}/api/hab/assess`)
    if (!res.ok) return null
    const data = await res.json()
    const prob = data?.hab?.probability
    return (prob !== null && prob !== undefined && Number.isFinite(prob)) ? prob : null
  } catch { return null }
}

async function emitFullSnapshot() {
  try {
    const snapshots = await getLatestSnapshots()
    const rawFlags  = await getRecentRiskFlags(6)
    const flags     = dedupFlagsForEmit(rawFlags)
    const habProb   = await getHABProbForSnapshot()
    pollerEvents.emit('snapshot', {
      snapshot_time:   new Date().toISOString(),
      sources_fetched: snapshots.length,
      risk_flags:      flags,
      hab_risk_score:  computeHABRiskScore(flags, habProb),
      data:            Object.fromEntries(snapshots.map(s => [s.source_id, s])),
    })
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
