export const forceSimulationStepSelectConfig = {
  parameters: {
    alpha: 0.2,
    velocityDecay: 0.5,
    velocityDecayBase: 0.5,
    velocityDecayTransitionEnterMode: 0.5,
  },
  forces: [
    {
      type: 'superF',
      enabled: true,
      push: {
        enabled: true,
        // strength: 0.1,
        strength: 0.1,
        yFactor: 1.5,
        // xFactor: 0.8,
        selector: 'focused',
        pointerFollow: {
          enabled: false,
          x: true,
          y: true,
          scaling: 0.25,
        },
        pointerFollowAlt: {
          enabled: false,
          x: true,
          y: true,
          scaling: 0.25,
        },
        centerMagic: true,
      },
      lattice: {
        enabled: true,
        strength: 0.8,
        // yFactor: 1.5,
        yFactor: 1.5,
        xFactor: 1,
        maxLevelsFromCenter: 30,
        // xFactor: 2,
      },
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
