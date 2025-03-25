export const forceSimulationStepPreviewConfig = {
  parameters: {
    // alpha: 0.2,
    alpha: 0.15,
    // velocityDecay: 0.6,
    velocityDecay: 0.7,
    velocityDecayBase: 0.7,
    velocityDecayTransitionEnterMode: 0.85,
  },
  forces: [
    // {
    //   type: 'lattice',
    //   enabled: true,
    //   strength: 0.8,
    //   yFactor: 3.5,
    //   xFactor: 1,
    //   maxLevelsFromCenter: 30,
    //   maxRadius: 300,
    // },
    {
      type: 'omni',
      enabled: true,
      requestMediaVersions: true,
      manageWeights: true,
      push: {
        strength: 0.15,
        // strength: 0.4,
        selector: 'focused',
        yFactor: 2.5,
        breathing: true,
        alignmentMaxLevelsX: 40,
        // centerXStretchMod: 1,
        // centerXStretchMod: 1.25,
        centerXStretchMod: 0.5,
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
