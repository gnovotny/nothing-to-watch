export const previewForceSimulationStepConfig = {
  parameters: {
    // alpha: 0.2,
    alpha: 0.15,
    // velocityDecay: 0.6,
    velocityDecay: 0.7,
    velocityDecayBase: 0.7,
    velocityDecayTransitionEnterMode: 0.85,
  },
  forces: [
    {
      type: 'omni',
      enabled: true,
      manageWeights: true,
      pointer: {
        // lerpCenterToPrimaryCellOnIdle: false,
      },
      requestMediaVersions: {
        enabled: true,
      },
      breathing: {
        // enabled: true,
        enabled: false, // todo
      },
      push: {
        // strength: 0.15,
        // strength: 0.2, // for smaller push radius
        strength: 0.1,
        // strength: 0.4,
        yFactor: 2.5,
        // yFactor: 3,
        alignmentMaxLevelsX: 40,
        centerXStretchMod: 0.4,
        // centerXStretchMod: 1.5,
        speedFactor: 1,
      },
      lattice: {
        strength: 0.8,
        yFactor: 3.75,
        xFactor: 1,
        maxLevelsFromPrimary: 30,
      },
      origin: {
        strength: 0.8,
        yFactor: 1.5,
      },
    },
  ],
}
