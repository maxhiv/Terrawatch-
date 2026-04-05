import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '../../data/terrawatch.db')
const DATA_DIR = path.join(__dirname, '../../data')

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

let _db = null
let _SQL = null

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS sensor_readings (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    ts        INTEGER NOT NULL,
    source    TEXT NOT NULL,
    station   TEXT NOT NULL,
    param     TEXT NOT NULL,
    value     REAL,
    unit      TEXT,
    lat       REAL,
    lon       REAL
  );
  CREATE INDEX IF NOT EXISTS idx_sr_ts      ON sensor_readings(ts DESC);
  CREATE INDEX IF NOT EXISTS idx_sr_station ON sensor_readings(station, param, ts DESC);

  CREATE TABLE IF NOT EXISTS feature_vectors (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    ts              INTEGER NOT NULL,
    features        TEXT NOT NULL,
    label_hab       INTEGER,
    label_hypoxia   INTEGER,
    phase3_exported INTEGER DEFAULT 0,
    source_count    INTEGER DEFAULT 0,
    gap_filled_fields TEXT,
    adph_confirmed  INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_fv_ts ON feature_vectors(ts DESC);

  CREATE TABLE IF NOT EXISTS hab_events (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    ts         INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    station    TEXT,
    value      REAL,
    duration_h REAL,
    source     TEXT,
    confirmed  INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_he_ts ON hab_events(ts DESC);

  CREATE TABLE IF NOT EXISTS model_registry (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ts          INTEGER NOT NULL,
    model_type  TEXT NOT NULL,
    version     TEXT NOT NULL,
    accuracy    REAL,
    auc_roc     REAL,
    n_samples   INTEGER,
    weights     TEXT,
    deployed    INTEGER DEFAULT 0,
    phase       INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS retrain_log (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    ts        INTEGER NOT NULL,
    status    TEXT NOT NULL,
    accuracy  REAL,
    prev_accuracy REAL,
    n_samples INTEGER,
    promoted  INTEGER DEFAULT 0,
    notes     TEXT
  );

  CREATE TABLE IF NOT EXISTS schema_versions (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    version   TEXT NOT NULL,
    applied   INTEGER NOT NULL,
    notes     TEXT
  );

  CREATE TABLE IF NOT EXISTS data_source_health (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ts          INTEGER NOT NULL,
    source_name TEXT NOT NULL,
    status      TEXT NOT NULL,
    latency_ms  INTEGER,
    records     INTEGER DEFAULT 0,
    error       TEXT,
    meta        TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_dsh_ts ON data_source_health(ts DESC);
  CREATE INDEX IF NOT EXISTS idx_dsh_src ON data_source_health(source_name, ts DESC);

  CREATE TABLE IF NOT EXISTS openeo_jobs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id      TEXT NOT NULL,
    ts_created  INTEGER NOT NULL,
    ts_updated  INTEGER,
    status      TEXT NOT NULL,
    algorithm   TEXT,
    bbox        TEXT,
    result_url  TEXT,
    meta        TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_oej_status ON openeo_jobs(status);

  CREATE TABLE IF NOT EXISTS data_source_snapshots (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id   TEXT NOT NULL,
    label       TEXT,
    category    TEXT,
    timestamp   TEXT NOT NULL,
    elapsed_ms  INTEGER,
    data        TEXT,
    flags       TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_dss_src_ts ON data_source_snapshots(source_id, timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_dss_ts ON data_source_snapshots(timestamp DESC);

  CREATE TABLE IF NOT EXISTS risk_flag_events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id   TEXT NOT NULL,
    flag        TEXT NOT NULL,
    context     TEXT,
    timestamp   TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_rfe_ts ON risk_flag_events(timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_rfe_src ON risk_flag_events(source_id, timestamp DESC);
`

export async function getDB() {
  if (_db) return _db

  _SQL = await initSqlJs()

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH)
    _db = new _SQL.Database(fileBuffer)
  } else {
    _db = new _SQL.Database()
  }

  _db.run(SCHEMA)
  saveDB()
  return _db
}

export function saveDB() {
  if (!_db) return
  try {
    const data = _db.export()
    fs.writeFileSync(DB_PATH, Buffer.from(data))
  } catch (err) {
    console.error('[DB] Save error:', err.message)
  }
}

export async function writeReadings(rows) {
  const db = await getDB()
  const stmt = db.prepare(
    'INSERT INTO sensor_readings (ts,source,station,param,value,unit,lat,lon) VALUES (?,?,?,?,?,?,?,?)'
  )
  for (const r of rows) {
    stmt.run([r[0], r[1], r[2], r[3], r[4], r[5]||'', r[6]||null, r[7]||null])
  }
  stmt.free()
  saveDB()
}

export async function writeFeatureVector(ts, features, labels = {}, meta = {}) {
  const db = await getDB()
  db.run(
    'INSERT INTO feature_vectors (ts,features,label_hab,label_hypoxia,source_count,gap_filled_fields,adph_confirmed) VALUES (?,?,?,?,?,?,?)',
    [ts, JSON.stringify(features), labels.hab ?? null, labels.hypoxia ?? null, meta.sourceCount ?? null, meta.gapFilledFields ?? null, meta.adphConfirmed ?? null]
  )
  saveDB()
}

export async function writeHabEvent(ts, type, station, value, source) {
  const db = await getDB()
  db.run(
    'INSERT INTO hab_events (ts,event_type,station,value,source) VALUES (?,?,?,?,?)',
    [ts, type, station, value, source]
  )
  saveDB()
}

export async function writeModel(modelType, version, accuracy, aucRoc, nSamples, weights, phase = 1) {
  const db = await getDB()
  db.run("UPDATE model_registry SET deployed=0 WHERE model_type=?", [modelType])
  db.run(
    'INSERT INTO model_registry (ts,model_type,version,accuracy,auc_roc,n_samples,weights,deployed,phase) VALUES (?,?,?,?,?,?,?,1,?)',
    [Date.now(), modelType, version, accuracy, aucRoc, nSamples, JSON.stringify(weights), phase]
  )
  saveDB()
}

// ── GOES-19 push DB reader ────────────────────────────────────────────────────
// Reads the most recent value for each GOES parameter written by routes/goes19.js
// Returns null for any param not received within the last 4 hours.
export async function getLatestGOESReadings() {
  const db = await getDB()
  const PARAMS = [
    'sst_mean', 'sst_gradient', 'qpe_rainfall', 'qpe_6h', 'qpe_24h',
    'cloud_coverage', 'glm_flashes', 'glm_active', 'amv_wind_speed', 'amv_wind_dir',
  ]
  const cutoff = Date.now() - 4 * 3600000
  const result = {}
  for (const param of PARAMS) {
    const stmt = db.prepare(
      'SELECT value FROM sensor_readings WHERE station=? AND param=? AND ts>? ORDER BY ts DESC LIMIT 1'
    )
    stmt.bind(['GOES19-ABI', param, cutoff])
    result[param] = stmt.step() ? stmt.getAsObject().value : null
    stmt.free()
  }

  const rgbStmt = db.prepare(
    'SELECT value FROM sensor_readings WHERE station=? AND param=? AND ts>? ORDER BY ts DESC LIMIT 1'
  )
  rgbStmt.bind(['GOES19-ABI', 'rgb_ratios', cutoff])
  if (rgbStmt.step()) {
    try {
      const raw = rgbStmt.getAsObject().value
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      result.bloom_index = parsed?.bloom_index ?? null
      result.turbidity_idx = parsed?.turbidity_idx ?? null
    } catch { result.bloom_index = null; result.turbidity_idx = null }
  }
  rgbStmt.free()

  return result
}

export async function getHistory(station, param, hours = 168) {
  const db = await getDB()
  const since = Date.now() - hours * 3600000
  const stmt = db.prepare(
    'SELECT ts, value FROM sensor_readings WHERE station=? AND param=? AND ts>? ORDER BY ts ASC'
  )
  const rows = []
  stmt.bind([station, param, since])
  while (stmt.step()) rows.push({ ts: stmt.getAsObject().ts, value: stmt.getAsObject().value })
  stmt.free()
  return rows
}

export async function getLabeledVectors(limit = 2000) {
  const db = await getDB()
  const stmt = db.prepare(
    'SELECT ts, features, label_hab, label_hypoxia FROM feature_vectors WHERE label_hab IS NOT NULL OR label_hypoxia IS NOT NULL ORDER BY ts DESC LIMIT ?'
  )
  const rows = []
  stmt.bind([limit])
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

export async function getAllVectors(limit = 5000) {
  const db = await getDB()
  const stmt = db.prepare('SELECT ts, features, label_hab, label_hypoxia FROM feature_vectors ORDER BY ts DESC LIMIT ?')
  const rows = []
  stmt.bind([limit])
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

export async function getUnexportedVectors(limit = 1000) {
  const db = await getDB()
  const stmt = db.prepare(
    'SELECT id, ts, features, label_hab, label_hypoxia FROM feature_vectors WHERE phase3_exported=0 ORDER BY ts ASC LIMIT ?'
  )
  const rows = []
  stmt.bind([limit])
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

export async function markVectorsExported(ids) {
  if (!ids.length) return
  const db = await getDB()
  db.run(`UPDATE feature_vectors SET phase3_exported=1 WHERE id IN (${ids.map(()=>'?').join(',')})`, ids)
  saveDB()
}

export async function getDeployedModel(modelType) {
  const db = await getDB()
  const stmt = db.prepare('SELECT * FROM model_registry WHERE model_type=? AND deployed=1 ORDER BY ts DESC LIMIT 1')
  stmt.bind([modelType])
  const row = stmt.step() ? stmt.getAsObject() : null
  stmt.free()
  if (row?.weights) row.weights = JSON.parse(row.weights)
  return row
}

export async function getDBStats() {
  const db = await getDB()
  const readingCount = db.exec('SELECT COUNT(*) as n FROM sensor_readings')[0]?.values[0][0] || 0
  const vectorCount  = db.exec('SELECT COUNT(*) as n FROM feature_vectors')[0]?.values[0][0] || 0
  const labeledCount = db.exec('SELECT COUNT(*) as n FROM feature_vectors WHERE label_hab IS NOT NULL OR label_hypoxia IS NOT NULL')[0]?.values[0][0] || 0
  const eventCount   = db.exec('SELECT COUNT(*) as n FROM hab_events')[0]?.values[0][0] || 0
  const modelCount   = db.exec('SELECT COUNT(*) as n FROM model_registry')[0]?.values[0][0] || 0
  const oldestTs     = db.exec('SELECT MIN(ts) as n FROM sensor_readings')[0]?.values[0][0] || null
  const newestTs     = db.exec('SELECT MAX(ts) as n FROM sensor_readings')[0]?.values[0][0] || null
  const dbSizeBytes  = fs.existsSync(DB_PATH) ? fs.statSync(DB_PATH).size : 0

  const daysSinceStart = oldestTs ? (Date.now() - oldestTs) / 86400000 : 0
  const phase3Ready = vectorCount >= 2000 && labeledCount >= 200

  return {
    readings:       readingCount,
    vectors:        vectorCount,
    labeled:        labeledCount,
    events:         eventCount,
    models:         modelCount,
    oldestReading:  oldestTs ? new Date(oldestTs).toISOString() : null,
    newestReading:  newestTs ? new Date(newestTs).toISOString() : null,
    daysSinceStart: Math.round(daysSinceStart * 10) / 10,
    dbSizeMB:       Math.round(dbSizeBytes / 1048576 * 100) / 100,
    dbPath:         DB_PATH,
    phase3Ready,
    phase3Threshold: { vectors: 2000, labeled: 200 },
    phase3Progress: {
      vectors: Math.min(100, Math.round(vectorCount / 2000 * 100)),
      labeled: Math.min(100, Math.round(labeledCount / 200 * 100)),
    },
  }
}

export async function getRecentEvents(limit = 20) {
  const db = await getDB()
  const stmt = db.prepare('SELECT * FROM hab_events ORDER BY ts DESC LIMIT ?')
  const rows = []
  stmt.bind([limit])
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

export async function getModelHistory(limit = 10) {
  const db = await getDB()
  const stmt = db.prepare('SELECT ts,model_type,version,accuracy,auc_roc,n_samples,deployed,phase FROM model_registry ORDER BY ts DESC LIMIT ?')
  const rows = []
  stmt.bind([limit])
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

export async function writeRetrainLog(entry) {
  const db = await getDB()
  db.run(
    'INSERT INTO retrain_log (ts,status,accuracy,prev_accuracy,n_samples,promoted,notes) VALUES (?,?,?,?,?,?,?)',
    [Date.now(), entry.status, entry.accuracy||null, entry.prevAccuracy||null, entry.nSamples||0, entry.promoted?1:0, entry.notes||'']
  )
  saveDB()
}

export async function writeSourceHealth(sourceName, status, latencyMs = null, records = 0, error = null, meta = null) {
  const db = await getDB()
  db.run(
    'INSERT INTO data_source_health (ts,source_name,status,latency_ms,records,error,meta) VALUES (?,?,?,?,?,?,?)',
    [Date.now(), sourceName, status, latencyMs, records, error, meta ? JSON.stringify(meta) : null]
  )
  saveDB()
}

export async function getSourceHealthSummary(hours = 24) {
  const db = await getDB()
  const since = Date.now() - hours * 3600000
  const stmt = db.prepare(
    `SELECT source_name, status, latency_ms, records, error, ts
     FROM data_source_health
     WHERE ts > ?
     ORDER BY ts DESC`
  )
  stmt.bind([since])
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()

  const sources = {}
  for (const row of rows) {
    if (!sources[row.source_name]) {
      sources[row.source_name] = {
        source: row.source_name,
        latestStatus: row.status,
        latestTs: row.ts,
        avgLatency: null,
        totalChecks: 0,
        failures: 0,
        latencies: [],
      }
    }
    const s = sources[row.source_name]
    s.totalChecks++
    if (row.status === 'error' || row.status === 'timeout') s.failures++
    if (row.latency_ms != null) s.latencies.push(row.latency_ms)
  }

  for (const s of Object.values(sources)) {
    s.avgLatency = s.latencies.length ? Math.round(s.latencies.reduce((a,b) => a+b, 0) / s.latencies.length) : null
    s.uptime = s.totalChecks > 0 ? Math.round((1 - s.failures / s.totalChecks) * 1000) / 10 : null
    delete s.latencies
  }

  return Object.values(sources)
}

export async function upsertOpenEOJob(jobId, status, algorithm = null, bbox = null, resultUrl = null, meta = null) {
  const db = await getDB()
  const checkStmt = db.prepare('SELECT id FROM openeo_jobs WHERE job_id = ?')
  checkStmt.bind([jobId])
  const exists = checkStmt.step()
  checkStmt.free()
  if (exists) {
    db.run(
      'UPDATE openeo_jobs SET ts_updated=?, status=?, result_url=COALESCE(?,result_url), meta=COALESCE(?,meta) WHERE job_id=?',
      [Date.now(), status, resultUrl, meta ? JSON.stringify(meta) : null, jobId]
    )
  } else {
    db.run(
      'INSERT INTO openeo_jobs (job_id,ts_created,ts_updated,status,algorithm,bbox,result_url,meta) VALUES (?,?,?,?,?,?,?,?)',
      [jobId, Date.now(), Date.now(), status, algorithm, bbox, resultUrl, meta ? JSON.stringify(meta) : null]
    )
  }
  saveDB()
}

export async function getOpenEOJob(jobId) {
  const db = await getDB()
  const stmt = db.prepare('SELECT * FROM openeo_jobs WHERE job_id=? LIMIT 1')
  stmt.bind([jobId])
  const row = stmt.step() ? stmt.getAsObject() : null
  stmt.free()
  if (row?.meta) try { row.meta = JSON.parse(row.meta) } catch (parseErr) { /* keep raw meta string */ }
  return row
}

export async function getUnlabeledVectors() {
  const db = await getDB()
  const stmt = db.prepare('SELECT id, ts, features FROM feature_vectors WHERE label_hab IS NULL AND label_hypoxia IS NULL')
  const rows = []
  while (stmt.step()) {
    const r = stmt.getAsObject()
    r.features = typeof r.features === 'string' ? JSON.parse(r.features) : r.features
    rows.push(r)
  }
  stmt.free()
  return rows
}

export async function updateVectorLabels(id, labelHab, labelHypoxia) {
  const db = await getDB()
  db.run('UPDATE feature_vectors SET label_hab = ?, label_hypoxia = ? WHERE id = ?', [labelHab, labelHypoxia, id])
}

export async function batchUpdateVectorLabels(updates) {
  const db = await getDB()
  const stmt = db.prepare('UPDATE feature_vectors SET label_hab = ?, label_hypoxia = ? WHERE id = ?')
  for (const u of updates) {
    stmt.bind([u.labelHab, u.labelHypoxia, u.id])
    stmt.step()
    stmt.reset()
  }
  stmt.free()
  saveDB()
}

export async function getLatestVector() {
  const db = await getDB()
  const stmt = db.prepare('SELECT ts, features, label_hab, label_hypoxia FROM feature_vectors ORDER BY ts DESC LIMIT 1')
  const row = stmt.step() ? stmt.getAsObject() : null
  stmt.free()
  if (row?.features) row.features = typeof row.features === 'string' ? JSON.parse(row.features) : row.features
  return row
}

export async function getRecentVectors(limit = 50) {
  const db = await getDB()
  const stmt = db.prepare('SELECT ts, features FROM feature_vectors ORDER BY ts DESC LIMIT ?')
  stmt.bind([limit])
  const rows = []
  while (stmt.step()) {
    const r = stmt.getAsObject()
    r.features = typeof r.features === 'string' ? JSON.parse(r.features) : r.features
    rows.push(r)
  }
  stmt.free()
  return rows
}

export async function saveSnapshot(snapshot) {
  const db = await getDB()
  db.run(
    `INSERT INTO data_source_snapshots (source_id, label, category, timestamp, elapsed_ms, data, flags)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      snapshot.source_id,
      snapshot.label,
      snapshot.category,
      snapshot.timestamp,
      snapshot.elapsed_ms,
      JSON.stringify(snapshot.data),
      JSON.stringify(snapshot.flags),
    ]
  )

  const pruneStmt = db.prepare(
    `DELETE FROM data_source_snapshots WHERE source_id = ? AND id NOT IN (
       SELECT id FROM data_source_snapshots WHERE source_id = ? ORDER BY timestamp DESC LIMIT 200
     )`
  )
  pruneStmt.run([snapshot.source_id, snapshot.source_id])
  pruneStmt.free()
  saveDB()
}

export async function getLatestSnapshots() {
  const db = await getDB()
  const stmt = db.prepare(
    `SELECT d1.source_id, d1.label, d1.category, d1.timestamp, d1.elapsed_ms, d1.data, d1.flags
     FROM data_source_snapshots d1
     INNER JOIN (
       SELECT source_id, MAX(timestamp) as max_ts FROM data_source_snapshots GROUP BY source_id
     ) d2 ON d1.source_id = d2.source_id AND d1.timestamp = d2.max_ts`
  )
  const rows = []
  while (stmt.step()) {
    const r = stmt.getAsObject()
    try { r.data = JSON.parse(r.data) } catch {}
    try { r.flags = JSON.parse(r.flags) } catch {}
    rows.push(r)
  }
  stmt.free()
  return rows
}

export async function getLatestSnapshotForSource(sourceId) {
  const db = await getDB()
  const stmt = db.prepare(
    `SELECT source_id, label, category, timestamp, elapsed_ms, data, flags
     FROM data_source_snapshots WHERE source_id = ? ORDER BY timestamp DESC LIMIT 1`
  )
  stmt.bind([sourceId])
  const row = stmt.step() ? stmt.getAsObject() : null
  stmt.free()
  if (row) {
    try { row.data = JSON.parse(row.data) } catch {}
    try { row.flags = JSON.parse(row.flags) } catch {}
  }
  return row
}

export async function getSnapshotHistory(sourceId, hours = 24) {
  const db = await getDB()
  const cutoff = new Date(Date.now() - hours * 3600000).toISOString()
  const stmt = db.prepare(
    `SELECT source_id, timestamp, elapsed_ms, data, flags
     FROM data_source_snapshots WHERE source_id = ? AND timestamp > ? ORDER BY timestamp DESC`
  )
  stmt.bind([sourceId, cutoff])
  const rows = []
  while (stmt.step()) {
    const r = stmt.getAsObject()
    try { r.data = JSON.parse(r.data) } catch {}
    try { r.flags = JSON.parse(r.flags) } catch {}
    rows.push(r)
  }
  stmt.free()
  return rows
}

export async function saveRiskFlags(flags) {
  const db = await getDB()

  const checkStmt = db.prepare(
    `SELECT COUNT(*) as cnt FROM risk_flag_events
     WHERE source_id = ? AND flag = ? AND timestamp >= ? AND timestamp < ?`
  )

  const insertStmt = db.prepare(
    `INSERT INTO risk_flag_events (source_id, flag, context, timestamp) VALUES (?, ?, ?, ?)`
  )

  for (const f of flags) {
    const ts = f.timestamp || new Date().toISOString()
    const hourBucket = Math.floor(new Date(ts).getTime() / 3600000)
    const bucketStart = new Date(hourBucket * 3600000).toISOString()
    const bucketEnd = new Date((hourBucket + 1) * 3600000).toISOString()

    checkStmt.bind([f.source_id, f.flag, bucketStart, bucketEnd])
    const exists = checkStmt.step() ? checkStmt.getAsObject().cnt > 0 : false
    checkStmt.reset()

    if (exists) {
      console.log(`[FLAG DEDUP] Suppressed duplicate: ${f.flag} from ${f.source_id}`)
      continue
    }

    insertStmt.run([f.source_id, f.flag, f.context ?? null, ts])
  }

  checkStmt.free()
  insertStmt.free()

  const cutoff = new Date(Date.now() - 7 * 24 * 3600000).toISOString()
  db.run(`DELETE FROM risk_flag_events WHERE timestamp < ?`, [cutoff])

  saveDB()
}

export async function getRecentRiskFlags(hours = 24) {
  const db = await getDB()
  const cutoff = new Date(Date.now() - hours * 3600000).toISOString()
  const stmt = db.prepare(
    `SELECT source_id, flag, context, timestamp FROM risk_flag_events
     WHERE timestamp > ? ORDER BY timestamp DESC LIMIT 200`
  )
  stmt.bind([cutoff])
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

export async function getHABRiskHistory(hours = 72) {
  const db = await getDB()
  const cutoff = new Date(Date.now() - hours * 3600000).toISOString()
  const stmt = db.prepare(
    `SELECT timestamp, flags FROM data_source_snapshots
     WHERE timestamp > ? ORDER BY timestamp ASC`
  )
  stmt.bind([cutoff])
  const rows = []
  while (stmt.step()) {
    const r = stmt.getAsObject()
    try { r.flags = JSON.parse(r.flags) } catch {}
    rows.push(r)
  }
  stmt.free()
  return rows
}
