export const ST_TRANSFORMER_SPEC = {
  name: 'Spatio-Temporal Transformer',
  version: '0.1.0-stub',
  status: 'architecture_defined',
  description: 'Self-attention mechanism for multi-station DO₂ time series forecasting.',
  architecture: {
    inputDim: 142,
    nHeads: 4,
    nLayers: 3,
    dModel: 128,
    dFF: 256,
    dropout: 0.1,
    maxSeqLen: 168,
    positionalEncoding: 'sinusoidal',
    outputHeads: ['do2_6h', 'do2_24h', 'do2_72h'],
  },
  trainingRequirements: {
    minSamples: 5000,
    framework: 'PyTorch or TensorFlow',
    estimatedTrainingTime: '4-8 hours on GPU',
    note: 'Attention weights provide natural explainability for which stations/timepoints matter most.',
  },
}

export function getSTTransformerStatus() {
  return {
    ...ST_TRANSFORMER_SPEC,
    ready: false,
    activationPhase: 4,
    prerequisite: 'Requires dense temporal coverage from 6+ stations over 60+ days.',
  }
}
