export const forceSimulationStepIntroConfig = {
  parameters: {
    alpha: 0.2,
    alphaTarget: 0,
    alphaDecay: 0,
    alphaMin: 0,
    velocityDecay: 0.85,
    velocityDecayBase: 0.85,
    velocityDecayTransitionEnterMode: 0.85,
  },
  forces: [
    {
      type: 'superF',
      enabled: true,
      push: {
        enabled: false,
      },
      // lattice: {
      //   enabled: false,
      //   strength: 0.8,
      //   yFactor: 1.5,
      //   xFactor: 1,
      //   maxLevelsFromCenter: 55,
      // },
      origin: {
        enabled: true,
        strength: 0.1,
      },
    },
    // {
    //   type: 'moveCenterToPoint',
    //   enabled: true,
    //   strength: 0.1,
    //   // yFactor: 1.5,
    //   // xFactor: 0.8,
    //   selector: 'focused',
    //   point: {
    //     x: undefined,
    //     y: undefined,
    //   },
    // },
  ],
}
