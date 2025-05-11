export const selectForceSimulationStepConfig = {
  parameters: {
    alpha: 0.2,
    velocityDecay: 0.5,
    velocityDecayBase: 0.5,
    velocityDecayTransitionEnterMode: 0.5,
  },
  forces: [
    // {
    //   type: 'omni',
    //   enabled: true,
    //   manageWeights: true,
    //   requestMediaVersions: {
    //     enabled: true,
    //     v3ColLevelAdjacencyThreshold: 1,
    //     v3RowLevelAdjacencyThreshold: 1,
    //   },
    //   breathing: {
    //     enabled: false,
    //   },
    //   push: {
    //     strength: 0.1,
    //     selector: 'focused',
    //     yFactor: 1.5,
    //   },
    //   lattice: {
    //     strength: 0.8,
    //     yFactor: 1.5,
    //     xFactor: 1,
    //     maxLevelsFromPrimary: 50,
    //   },
    //   origin: {
    //     strength: 0.1,
    //     // yFactor: 1.5,
    //   },
    // },
    {
      type: 'omni',
      enabled: true,
      manageWeights: true,
      requestMediaVersions: {
        enabled: true,
        v3ColLevelAdjacencyThreshold: 1,
        v3RowLevelAdjacencyThreshold: 1,
        v2ColLevelAdjacencyThreshold: 18,
        v2RowLevelAdjacencyThreshold: 18,
      },
      breathing: {
        enabled: true,
      },
      push: {
        // strength: 0.1, // for smaller push radius
        strength: 0.05,
        selector: 'focused',
        yFactor: 2.5,
        centerXStretchMod: 2.5,
      },
      lattice: {
        strength: 0.8,
        yFactor: 2.75,
        xFactor: 1,
        maxLevelsFromPrimary: 50,
        // cellSizeMod: 10,
      },
      origin: {
        strength: 0.1,
        // yFactor: 1.5,
        latticeScale: 10,
      },
    },
  ],
}
