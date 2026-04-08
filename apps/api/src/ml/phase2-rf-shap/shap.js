const mean = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

export function computePermutationSHAP(model, x, featureKeys, { nSamples = 50, predictFn } = {}) {
  if (!predictFn || !featureKeys || featureKeys.length === 0) {
    return { contributions: [], narrative: 'Insufficient data for SHAP analysis.' }
  }

  const baseProb = predictFn(x)
  const contributions = []

  for (let f = 0; f < featureKeys.length; f++) {
    const permuted = [...x]
    const deltas = []

    for (let s = 0; s < nSamples; s++) {
      const noise = (Math.random() - 0.5) * 2 * Math.max(1, Math.abs(x[f]) * 0.3)
      permuted[f] = x[f] + noise
      const permProb = predictFn(permuted)
      deltas.push(baseProb - permProb)
      permuted[f] = x[f]
    }

    const avgDelta = mean(deltas)
    contributions.push({
      feature: featureKeys[f],
      contribution: Math.round(avgDelta * 10000) / 10000,
      direction: avgDelta > 0 ? 'increases_risk' : avgDelta < 0 ? 'decreases_risk' : 'neutral',
      magnitude: Math.abs(avgDelta),
    })
  }

  contributions.sort((a, b) => b.magnitude - a.magnitude)

  const top3 = contributions.slice(0, 3)
  const narrative = generateNarrative(top3, baseProb)

  return {
    baseProbability: Math.round(baseProb * 1000) / 1000,
    contributions,
    topFactors: top3,
    narrative,
  }
}

function generateNarrative(topFactors, baseProb) {
  if (topFactors.length === 0) return 'No significant factors identified.'

  const riskLabel = baseProb > 0.65 ? 'elevated' : baseProb > 0.35 ? 'moderate' : 'low'
  const parts = [`Current risk is ${riskLabel} (${Math.round(baseProb * 100)}%).`]

  for (const f of topFactors) {
    const name = f.feature.replace(/_/g, ' ')
    if (f.direction === 'increases_risk') {
      parts.push(`${name} is driving risk higher.`)
    } else if (f.direction === 'decreases_risk') {
      parts.push(`${name} is reducing risk.`)
    }
  }

  return parts.join(' ')
}

export function shapSummary(contributions) {
  if (!contributions || contributions.length === 0) return {}

  const positive = contributions.filter(c => c.direction === 'increases_risk')
  const negative = contributions.filter(c => c.direction === 'decreases_risk')

  return {
    riskDrivers: positive.slice(0, 5).map(c => c.feature),
    protectiveFactors: negative.slice(0, 5).map(c => c.feature),
    totalRiskContribution: Math.round(positive.reduce((s, c) => s + c.magnitude, 0) * 1000) / 1000,
    totalProtection: Math.round(negative.reduce((s, c) => s + c.magnitude, 0) * 1000) / 1000,
  }
}
