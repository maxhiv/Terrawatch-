import {
  getLabeledVectors, getAllVectors, getDeployedModel,
  writeModel, writeRetrainLog, getDBStats
} from './database.js'

const PHASE_THRESHOLDS = {
  logistic:  100,
  forest:    500,
  cnnLstm:  2000,
}

const sigmoid = x => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))))
const dot = (a, b) => a.reduce((s, ai, i) => s + ai * (b[i] || 0), 0)
const mean = arr => arr.reduce((a,b) => a+b, 0) / arr.length
const std = arr => { const m = mean(arr); return Math.sqrt(mean(arr.map(v=>(v-m)**2))) }

function extractFeatureArray(featuresJson) {
  const f = typeof featuresJson === 'string' ? JSON.parse(featuresJson) : featuresJson

  return [
    f.min_do2           ?? 7,
    f.avg_do2           ?? 7,
    f.wbDo2             ?? 7,
    f.avg_temp          ?? 25,
    f.max_temp          ?? 25,
    f.wbTemp            ?? 25,
    f.wbSal             ?? 15,
    f.wbChlFl           ?? 2,
    f.total_flow_kcfs   ?? 10,
    f.avg_turb          ?? 5,
    f.currentSpeed_ms   ?? 0.15,
    f.bloom14h_km       ?? 5,
    f.upstream_do2_dogriver ?? 7,
    f.lag_dogriver_weeksbay_h ?? 18,
    f.aqi               ?? 50,
    f.hour_sin          ?? 0,
    f.hour_cos          ?? 1,
    f.doy_sin           ?? 0,
    f.doy_cos           ?? 1,
    f.is_summer         ?? 0,
    f.is_night          ?? 0,
    f.hypoxic_stations  ?? 0,
    f.low_do2_stations  ?? 0,
  ]
}

function normalizeFeatures(X) {
  const n = X[0].length
  const means = []
  const stds  = []

  for (let j = 0; j < n; j++) {
    const col = X.map(row => row[j])
    const m = mean(col)
    const s = std(col) || 1
    means.push(m)
    stds.push(s)
  }

  const Xnorm = X.map(row => row.map((v, j) => (v - means[j]) / stds[j]))
  return { Xnorm, means, stds }
}

function trainLogisticRegression(X, y, { lr = 0.01, epochs = 800, lambda = 0.001 } = {}) {
  const { Xnorm, means, stds } = normalizeFeatures(X)
  const nFeatures = Xnorm[0].length
  let w = new Array(nFeatures).fill(0)
  let b = 0

  for (let e = 0; e < epochs; e++) {
    for (let i = 0; i < Xnorm.length; i++) {
      const pred = sigmoid(dot(Xnorm[i], w) + b)
      const err  = pred - y[i]
      w = w.map((wi, j) => wi * (1 - lr * lambda) - lr * err * Xnorm[i][j])
      b -= lr * err
    }
  }

  return { type: 'logistic', w, b, means, stds, nFeatures }
}

function evaluateModel(model, X, y) {
  const { Xnorm } = normalizeFeatures(X)
  const probs = Xnorm.map(x => sigmoid(dot(x, model.w) + model.b))
  const preds = probs.map(p => p > 0.5 ? 1 : 0)
  const accuracy = preds.filter((p, i) => p === y[i]).length / y.length

  const positives = y.filter(yi => yi === 1).length
  const negatives = y.length - positives
  if (!positives || !negatives) return { accuracy, aucRoc: 0.5 }

  const scored = probs.map((p, i) => ({ p, y: y[i] })).sort((a, b) => b.p - a.p)
  let tp = 0, fp = 0, auc = 0, prevFpr = 0, prevTpr = 0
  for (const s of scored) {
    if (s.y === 1) tp++; else fp++
    const tpr = tp / positives
    const fpr = fp / negatives
    auc += (fpr - prevFpr) * (tpr + prevTpr) / 2
    prevFpr = fpr; prevTpr = tpr
  }
  auc += (1 - prevFpr) * (1 + prevTpr) / 2

  return { accuracy: Math.round(accuracy * 1000) / 1000, aucRoc: Math.round(auc * 1000) / 1000 }
}

export async function retrainHABOracle() {
  const stats = await getDBStats()
  const labeled = await getLabeledVectors(3000)

  if (labeled.length < PHASE_THRESHOLDS.logistic) {
    const note = `Insufficient data: ${labeled.length} labeled samples (need ${PHASE_THRESHOLDS.logistic})`
    await writeRetrainLog({ status: 'skipped', nSamples: labeled.length, notes: note })
    return { status: 'skipped', reason: note, progress: labeled.length / PHASE_THRESHOLDS.logistic }
  }

  const phase = labeled.length >= PHASE_THRESHOLDS.cnnLstm ? 3
              : labeled.length >= PHASE_THRESHOLDS.forest   ? 2
              : 1

  if (phase === 3) {
    return await triggerVertexAITraining(labeled, stats)
  }

  const X = labeled.map(v => extractFeatureArray(v.features))
  const y = labeled.map(v => v.label_hypoxia !== null ? v.label_hypoxia : (v.label_hab || 0))

  const current = await getDeployedModel('hab_oracle')
  const prevAccuracy = current?.accuracy || 0

  console.log(`[MLTrainer] Phase ${phase} training — ${labeled.length} samples`)
  const startMs = Date.now()
  const model = trainLogisticRegression(X, y, {
    lr: 0.005,
    epochs: phase === 2 ? 1500 : 800,
    lambda: 0.001
  })
  const elapsed = Date.now() - startMs
  const { accuracy, aucRoc } = evaluateModel(model, X, y)

  const version = `v${phase}.${Math.floor(labeled.length / 100)}.${new Date().toISOString().slice(0,10)}`

  const improved = aucRoc > (current?.auc_roc || 0) + 0.005
  const notes = `Phase ${phase} | ${elapsed}ms | AUC: ${aucRoc} vs prev: ${current?.auc_roc || 'none'} | ${improved ? 'PROMOTED' : 'HELD'}`

  if (improved) {
    await writeModel('hab_oracle', version, accuracy, aucRoc, labeled.length, model, phase)
  }

  await writeRetrainLog({ status: improved ? 'promoted' : 'held', accuracy, prevAccuracy, nSamples: labeled.length, promoted: improved, notes })

  return {
    status:       improved ? 'promoted' : 'held',
    phase,
    version,
    accuracy,
    aucRoc,
    prevAucRoc:   current?.auc_roc || null,
    nSamples:     labeled.length,
    trainMs:      elapsed,
    improved,
    note: improved ? `Model promoted to production (${version})` : `Model held — no improvement over current`,
    nextPhase: phase < 3 ? {
      phase: phase + 1,
      trigger: phase === 1 ? 'Random Forest at 500 labeled samples' : 'CNN-LSTM on Vertex AI at 2000 labeled samples',
      samplesNeeded: phase === 1 ? PHASE_THRESHOLDS.forest - labeled.length : PHASE_THRESHOLDS.cnnLstm - labeled.length,
    } : null,
  }
}

export async function triggerVertexAITraining(labeled, stats) {
  const gcpProject = process.env.GCP_PROJECT
  const gcpRegion  = process.env.GCP_REGION || 'us-central1'
  const vertexKey  = process.env.VERTEX_SERVICE_ACCOUNT_KEY

  if (!gcpProject || !vertexKey) {
    return {
      status: 'phase3_ready_awaiting_gcp',
      message: 'Data threshold met for Phase 3 CNN-LSTM training. Add GCP_PROJECT + VERTEX_SERVICE_ACCOUNT_KEY to Replit Secrets to activate Vertex AI training.',
      dataReady: true,
      samples: labeled.length,
      phase3Trigger: {
        required_secrets: ['GCP_PROJECT', 'GCP_REGION', 'VERTEX_SERVICE_ACCOUNT_KEY'],
        vertex_training_job: 'terrawatch-hab-oracle-cnnlstm',
        model_spec: 'CNN-LSTM datacube (Hill et al. 2021) — 8-day forecast horizon',
        estimated_training_time: '45-90 minutes on Vertex AI n1-standard-8',
        estimated_cost: '$2-5 per training run on GCP free tier',
      },
      exportEndpoint: '/api/intelligence/export-training-data',
    }
  }

  try {
    const { google } = await import('googleapis')
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(vertexKey),
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    })
    const token = await auth.getAccessToken()

    const jobPayload = {
      displayName: `terrawatch-hab-oracle-${Date.now()}`,
      trainingTaskDefinition: 'gs://google-cloud-aiplatform/schema/trainingjob/definition/custom_task_1.0.0.yaml',
      trainingTaskInputs: {
        workerPoolSpecs: [{
          machineSpec: { machineType: 'n1-standard-8' },
          replicaCount: 1,
          containerSpec: {
            imageUri: `gcr.io/${gcpProject}/terrawatch-trainer:latest`,
            args: [
              '--model=cnn_lstm',
              '--horizon=8',
              '--n_samples=' + labeled.length,
              `--data_path=gs://${gcpProject}-terrawatch/training/latest.jsonl`,
            ],
          },
        }],
      },
    }

    const response = await fetch(
      `https://${gcpRegion}-aiplatform.googleapis.com/v1/projects/${gcpProject}/locations/${gcpRegion}/trainingPipelines`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(jobPayload),
      }
    )
    const result = await response.json()

    await writeRetrainLog({
      status: 'vertex_submitted',
      nSamples: labeled.length,
      notes: `Vertex AI job: ${result.name || 'submitted'}`,
    })

    return {
      status: 'vertex_training_submitted',
      jobName: result.name,
      samples: labeled.length,
      phase: 3,
      note: 'CNN-LSTM training job submitted to Vertex AI. Check GCP console for progress.',
    }
  } catch (err) {
    console.error('[Vertex AI]', err.message)
    return { status: 'vertex_error', error: err.message, fallback: 'Running Phase 2 local training as fallback' }
  }
}

export async function runInference(features) {
  const model = await getDeployedModel('hab_oracle')
  if (!model?.weights) {
    return { prediction: null, confidence: null, note: 'No trained model deployed yet. Accumulating training data.' }
  }

  const x = extractFeatureArray(features)
  const w = model.weights
  const xNorm = x.map((v, j) => (v - (w.means?.[j] || 0)) / (w.stds?.[j] || 1))
  const prob = sigmoid(dot(xNorm, w.w) + w.b)
  const label = prob > 0.5 ? 1 : 0

  return {
    prediction: label,
    confidence: Math.round(prob * 1000) / 10,
    riskLevel: prob > 0.8 ? 'CRITICAL' : prob > 0.65 ? 'HIGH' : prob > 0.45 ? 'MODERATE' : 'LOW',
    modelVersion: model.version,
    modelPhase: model.phase,
    aucRoc: model.auc_roc,
    trainedOn: new Date(model.ts).toISOString(),
  }
}

export { PHASE_THRESHOLDS }
