import {
  getLabeledVectors, getAllVectors, getDeployedModel,
  writeModel, writeRetrainLog, getDBStats,
  getUnlabeledVectors, batchUpdateVectorLabels
} from '../../../../data/database.js'
import { trainRandomForest, predictForest, evaluateForest } from '../../../../ml/phase2-rf-shap/randomForest.js'
import { computePermutationSHAP } from '../../../../ml/phase2-rf-shap/shap.js'
import { autoLabel } from './crossSensor.js'
import { FEATURE_KEYS, FEATURE_DEFAULTS } from '../../../../ml/shared/featureVector.js'

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
  return FEATURE_KEYS.map(k => f[k] ?? FEATURE_DEFAULTS[k] ?? 0)
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

let backfillRunning = false

export async function backfillUnlabeledVectors() {
  if (backfillRunning) {
    console.log('[MLTrainer] Backfill: already running, skipping')
    return { backfilled: 0, total: 0, skipped: true }
  }
  backfillRunning = true
  try {
    const unlabeled = await getUnlabeledVectors()
    if (unlabeled.length === 0) {
      console.log('[MLTrainer] Backfill: no unlabeled vectors found')
      return { backfilled: 0, total: 0 }
    }

    const updates = []
    for (const vec of unlabeled) {
      const labels = autoLabel(vec.features)
      if (labels.hab != null || labels.hypoxia != null) {
        updates.push({ id: vec.id, labelHab: labels.hab, labelHypoxia: labels.hypoxia })
      }
    }

    if (updates.length > 0) {
      await batchUpdateVectorLabels(updates)
    }

    console.log(`[MLTrainer] Backfill complete: ${updates.length}/${unlabeled.length} vectors labeled`)
    return { backfilled: updates.length, total: unlabeled.length }
  } catch (err) {
    console.error('[MLTrainer] Backfill error:', err.message)
    return { backfilled: 0, total: 0, error: err.message }
  } finally {
    backfillRunning = false
  }
}

export async function retrainHABOracle() {
  await backfillUnlabeledVectors()
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

  console.log(`[MLTrainer] Phase ${phase} training — ${labeled.length} samples, ${FEATURE_KEYS.length} features`)
  const startMs = Date.now()

  let model, accuracy, aucRoc

  if (phase === 2) {
    model = trainRandomForest(X, y, { nTrees: 100, maxDepth: 10, minSamples: 5 })
    const eval2 = evaluateForest(model, X, y)
    accuracy = eval2.accuracy
    aucRoc = eval2.aucRoc
  } else {
    model = trainLogisticRegression(X, y, { lr: 0.005, epochs: 800, lambda: 0.001 })
    const eval1 = evaluateModel(model, X, y)
    accuracy = eval1.accuracy
    aucRoc = eval1.aucRoc
  }

  const elapsed = Date.now() - startMs
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
    nFeatures:    FEATURE_KEYS.length,
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

  let prob
  if (w.type === 'random_forest') {
    const result = predictForest(w, x)
    prob = result.probability
  } else {
    const xNorm = x.map((v, j) => (v - (w.means?.[j] || 0)) / (w.stds?.[j] || 1))
    prob = sigmoid(dot(xNorm, w.w) + w.b)
  }

  const label = prob > 0.5 ? 1 : 0
  const riskLevel = prob > 0.8 ? 'CRITICAL' : prob > 0.65 ? 'HIGH' : prob > 0.45 ? 'MODERATE' : 'LOW'

  let shapResult = null
  try {
    const predictFn = (xArr) => {
      if (w.type === 'random_forest') {
        return predictForest(w, xArr).probability
      }
      const xN = xArr.map((v, j) => (v - (w.means?.[j] || 0)) / (w.stds?.[j] || 1))
      return sigmoid(dot(xN, w.w) + w.b)
    }
    const rawShap = computePermutationSHAP(w, x, FEATURE_KEYS, { nSamples: 30, predictFn })
    if (rawShap?.contributions && Array.isArray(rawShap.contributions)) {
      shapResult = {}
      for (const c of rawShap.contributions) {
        if (c.feature && typeof c.contribution === 'number') {
          shapResult[c.feature] = c.contribution
        }
      }
    }
  } catch (err) {
    console.error('[MLTrainer] SHAP computation error:', err.message)
  }

  return {
    prediction: prob,
    probability: prob,
    label,
    confidence: Math.round(prob * 1000) / 10,
    riskLevel,
    modelVersion: model.version,
    modelPhase: model.phase,
    aucRoc: model.auc_roc,
    trainedOn: new Date(model.ts).toISOString(),
    nFeatures: FEATURE_KEYS.length,
    shap: shapResult,
  }
}

export function exportVectorsCSV(vectors) {
  if (!vectors || vectors.length === 0) return ''
  const header = ['ts', ...FEATURE_KEYS, 'label_hab', 'label_hypoxia'].join(',')
  const rows = vectors.map(v => {
    const f = typeof v.features === 'string' ? JSON.parse(v.features) : v.features
    const vals = FEATURE_KEYS.map(k => f[k] ?? '')
    return [v.ts, ...vals, v.label_hab ?? '', v.label_hypoxia ?? ''].join(',')
  })
  return [header, ...rows].join('\n')
}

export { PHASE_THRESHOLDS, FEATURE_KEYS }
