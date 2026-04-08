export const STF_GNN_SPEC = {
  name: 'Spatio-Temporal Fusion Graph Neural Network',
  version: '0.1.0-stub',
  status: 'architecture_defined',
  description: 'Sensor graph network for multi-station DO₂ prediction using spatial adjacency and temporal lag.',
  architecture: {
    inputNodes: 8,
    hiddenLayers: [64, 32],
    temporalWindow: 24,
    spatialEdges: [
      'DogRiver↔WeeksBay', 'FowlRiver↔WeeksBay', 'MobileRiver↔DauphinIs',
      'MobileI65↔Bucks', 'Bucks↔DogRiver', 'Claiborne↔MobileI65',
    ],
    aggregation: 'mean',
    activation: 'relu',
    outputHeads: ['do2_forecast_6h', 'do2_forecast_24h', 'hypoxia_prob'],
  },
  trainingRequirements: {
    minSamples: 2000,
    framework: 'PyTorch Geometric or TensorFlow GNN',
    estimatedTrainingTime: '2-4 hours on GPU',
  },
  note: 'Requires PyTorch Geometric. Stub for architecture documentation — activate in Phase 3+.',
}

export function getSTFGNNStatus() {
  return {
    ...STF_GNN_SPEC,
    ready: false,
    activationPhase: 3,
    prerequisite: 'Phase 3 CNN-LSTM must be trained first. Then GNN layer adds spatial correlation.',
  }
}
