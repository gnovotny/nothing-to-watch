export const defaultNeighborsSimulationStepConfig = {
  levels: 1,
}
export const defaultForceSimulationStepConfig = {
  parameters: {
    alpha: 0.2,
    alphaTarget: 0,
    alphaDecay: 0,
    alphaMin: 0,
    velocityDecay: 0.7,
  },
  forces: [
    {
      type: 'lattice',
      enabled: true,
      strength: 0.8,
    },
    {
      type: 'origin',
      enabled: true,
      strength: 0.8,
    },
    {
      type: 'push',
      enabled: true,
      strength: 0.3,
      selector: 'focused',
    },
  ],
}

export const defaultSimulationConfig = {
  steps: {
    neighbors: defaultNeighborsSimulationStepConfig,
    force: defaultForceSimulationStepConfig,
  },
}
