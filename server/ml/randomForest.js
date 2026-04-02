const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length

function bootstrapSample(X, y) {
  const n = X.length
  const idxs = []
  const oob = new Set(Array.from({ length: n }, (_, i) => i))
  for (let i = 0; i < n; i++) {
    const j = Math.floor(Math.random() * n)
    idxs.push(j)
    oob.delete(j)
  }
  return {
    X: idxs.map(i => X[i]),
    y: idxs.map(i => y[i]),
    oobIndices: [...oob],
  }
}

function giniImpurity(y) {
  if (y.length === 0) return 0
  const p1 = y.filter(v => v === 1).length / y.length
  return 1 - p1 * p1 - (1 - p1) * (1 - p1)
}

function bestSplit(X, y, featureSubset) {
  let bestGain = -Infinity
  let bestFeature = 0
  let bestThreshold = 0

  const parentGini = giniImpurity(y)

  for (const f of featureSubset) {
    const vals = X.map(row => row[f]).sort((a, b) => a - b)
    const uniq = [...new Set(vals)]
    const thresholds = uniq.length > 20
      ? Array.from({ length: 20 }, (_, i) => uniq[Math.floor(i * uniq.length / 20)])
      : uniq

    for (const t of thresholds) {
      const leftY = [], rightY = []
      for (let i = 0; i < X.length; i++) {
        if (X[i][f] <= t) leftY.push(y[i])
        else rightY.push(y[i])
      }
      if (leftY.length === 0 || rightY.length === 0) continue

      const wLeft = leftY.length / y.length
      const gain = parentGini - wLeft * giniImpurity(leftY) - (1 - wLeft) * giniImpurity(rightY)
      if (gain > bestGain) {
        bestGain = gain
        bestFeature = f
        bestThreshold = t
      }
    }
  }
  return { feature: bestFeature, threshold: bestThreshold, gain: bestGain }
}

function buildTree(X, y, depth, maxDepth, minSamples, nFeatures) {
  if (depth >= maxDepth || y.length < minSamples || new Set(y).size === 1) {
    const p = y.filter(v => v === 1).length / y.length
    return { leaf: true, prediction: p > 0.5 ? 1 : 0, probability: p, samples: y.length }
  }

  const featureSubset = []
  const allFeatures = Array.from({ length: X[0].length }, (_, i) => i)
  const m = Math.min(nFeatures, allFeatures.length)
  const shuffled = allFeatures.sort(() => Math.random() - 0.5)
  for (let i = 0; i < m; i++) featureSubset.push(shuffled[i])

  const { feature, threshold, gain } = bestSplit(X, y, featureSubset)
  if (gain <= 0) {
    const p = y.filter(v => v === 1).length / y.length
    return { leaf: true, prediction: p > 0.5 ? 1 : 0, probability: p, samples: y.length }
  }

  const leftX = [], leftY = [], rightX = [], rightY = []
  for (let i = 0; i < X.length; i++) {
    if (X[i][feature] <= threshold) { leftX.push(X[i]); leftY.push(y[i]) }
    else { rightX.push(X[i]); rightY.push(y[i]) }
  }

  return {
    leaf: false,
    feature,
    threshold,
    left: buildTree(leftX, leftY, depth + 1, maxDepth, minSamples, nFeatures),
    right: buildTree(rightX, rightY, depth + 1, maxDepth, minSamples, nFeatures),
  }
}

function predictTree(tree, x) {
  if (tree.leaf) return tree.probability
  return x[tree.feature] <= tree.threshold
    ? predictTree(tree.left, x)
    : predictTree(tree.right, x)
}

export function trainRandomForest(X, y, { nTrees = 100, maxDepth = 10, minSamples = 5 } = {}) {
  const nFeatures = Math.max(1, Math.floor(Math.sqrt(X[0].length)))
  const trees = []
  const oobPredictions = new Array(X.length).fill(null).map(() => [])

  for (let t = 0; t < nTrees; t++) {
    const { X: bsX, y: bsY, oobIndices } = bootstrapSample(X, y)
    const tree = buildTree(bsX, bsY, 0, maxDepth, minSamples, nFeatures)
    trees.push(tree)

    for (const idx of oobIndices) {
      oobPredictions[idx].push(predictTree(tree, X[idx]))
    }
  }

  let oobCorrect = 0, oobTotal = 0
  for (let i = 0; i < X.length; i++) {
    if (oobPredictions[i].length > 0) {
      const avgP = mean(oobPredictions[i])
      if ((avgP > 0.5 ? 1 : 0) === y[i]) oobCorrect++
      oobTotal++
    }
  }
  const oobAccuracy = oobTotal > 0 ? oobCorrect / oobTotal : null

  return {
    type: 'random_forest',
    nTrees,
    maxDepth,
    nFeatures: X[0].length,
    trees,
    oobAccuracy,
    oobSamples: oobTotal,
  }
}

export function predictForest(model, x) {
  const probs = model.trees.map(tree => predictTree(tree, x))
  const avgProb = mean(probs)
  return {
    prediction: avgProb > 0.5 ? 1 : 0,
    probability: Math.round(avgProb * 1000) / 1000,
    treeVotes: {
      positive: probs.filter(p => p > 0.5).length,
      negative: probs.filter(p => p <= 0.5).length,
    },
  }
}

export function evaluateForest(model, X, y) {
  let correct = 0
  const probs = []
  for (let i = 0; i < X.length; i++) {
    const p = mean(model.trees.map(tree => predictTree(tree, X[i])))
    probs.push(p)
    if ((p > 0.5 ? 1 : 0) === y[i]) correct++
  }
  const accuracy = correct / y.length

  const positives = y.filter(v => v === 1).length
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

  return {
    accuracy: Math.round(accuracy * 1000) / 1000,
    aucRoc: Math.round(auc * 1000) / 1000,
    oobAccuracy: model.oobAccuracy,
  }
}
