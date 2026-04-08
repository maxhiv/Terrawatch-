import axios from 'axios'
import { upsertOpenEOJob } from '../../../../data/database.js'

const OPENEO_BASE = 'https://openeo.vito.be/openeo/1.1'
const MOBILE_BAY_BBOX = { west: -88.5, south: 30.1, east: -87.5, north: 30.8 }

function getOpenEOAuth() {
  const user = process.env.COPERNICUS_USER
  const pass = process.env.COPERNICUS_PASS
  return (user && pass) ? { username: user, password: pass } : null
}

export async function submitBIOPARJob(daysBack = 15) {
  const auth = getOpenEOAuth()
  if (!auth) return { available: false, reason: 'COPERNICUS_USER + PASS not configured for openEO' }

  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - daysBack * 86400000).toISOString().split('T')[0]

  try {
    const processGraph = {
      loadcollection1: {
        process_id: 'load_collection',
        arguments: {
          id: 'BIOPAR_FAPAR_V2_GLOBAL',
          spatial_extent: MOBILE_BAY_BBOX,
          temporal_extent: [startDate, endDate],
        },
      },
      reducedimension1: {
        process_id: 'reduce_dimension',
        arguments: {
          data: { from_node: 'loadcollection1' },
          dimension: 'bands',
          reducer: {
            process_graph: {
              mean1: { process_id: 'mean', arguments: { data: { from_parameter: 'data' } }, result: true },
            },
          },
        },
      },
      saveresult1: {
        process_id: 'save_result',
        arguments: {
          data: { from_node: 'reducedimension1' },
          format: 'GTiff',
        },
        result: true,
      },
    }

    const { data } = await axios.post(`${OPENEO_BASE}/jobs`, {
      process: { process_graph: processGraph },
      title: `TERRAWATCH BIOPAR ${startDate} to ${endDate}`,
    }, {
      auth,
      timeout: 30000,
    })

    const jobId = data?.id || `biopar-${Date.now()}`
    await upsertOpenEOJob(jobId, 'created', 'BIOPAR_FAPAR_V2_GLOBAL', JSON.stringify(MOBILE_BAY_BBOX))

    return {
      available: true,
      jobId,
      status: 'created',
      algorithm: 'BIOPAR FAPAR v2',
      bbox: MOBILE_BAY_BBOX,
      temporal: { start: startDate, end: endDate },
    }
  } catch (err) {
    return {
      available: false,
      error: err.message,
      note: 'openEO BIOPAR job submission failed. Check Copernicus credentials.',
    }
  }
}

export async function checkBIOPARJobStatus(jobId) {
  const auth = getOpenEOAuth()
  if (!auth) return { available: false, reason: 'No credentials' }

  try {
    const { data } = await axios.get(`${OPENEO_BASE}/jobs/${jobId}`, { auth, timeout: 15000 })
    const status = data?.status || 'unknown'

    await upsertOpenEOJob(jobId, status)

    return {
      available: true,
      jobId,
      status,
      progress: data?.progress,
      created: data?.created,
      updated: data?.updated,
    }
  } catch (err) {
    return { available: false, jobId, error: err.message }
  }
}
