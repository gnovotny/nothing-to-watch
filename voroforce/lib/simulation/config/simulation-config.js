export const baseVoronoiSimulationStepConfig = {
  latticeNeighborLevels: 1,
}
export const baseForceSimulationStepConfig = {
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

const baseSimulationConfig = {
  steps: {
    voronoi: baseVoronoiSimulationStepConfig,
    force: baseForceSimulationStepConfig,
  },
}

export default baseSimulationConfig
