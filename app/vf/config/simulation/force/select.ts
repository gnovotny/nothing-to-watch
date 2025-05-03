export const forceSimulationStepSelectConfig = {
  parameters: {
    alpha: 0.2,
    velocityDecay: 0.5,
    velocityDecayBase: 0.5,
    velocityDecayTransitionEnterMode: 0.5,
  },
  forces: [
    {
      type: 'omni',
      enabled: true,
      requestMediaVersions: {
        enabled: true,
      },
      manageWeights: true,
      push: {
        strength: 0.1,
        selector: 'focused',
        yFactor: 1.5,
        breathing: true,
      },
      lattice: {
        strength: 0.8,
        yFactor: 1.5,
        xFactor: 1,
        maxLevelsFromPrimary: 50,
      },
      origin: {
        strength: 0.1,
        // yFactor: 1.5,
      },
    },
  ],
}
