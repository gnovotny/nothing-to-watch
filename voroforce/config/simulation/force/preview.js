export const forceSimulationStepPreviewConfig = {
  parameters: {
    // alpha: 0.15,
    // velocityDecay: 0.6,
    alpha: 0.2,
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
      type: 'superF',
      enabled: true,
      push: {
        // strength: 0.75,
        strength: 0.15,
        selector: 'focused',
        // yFactor: 1.5,
        yFactor: 2.5,
        xFactor: 0.8,
        // yFactor: 1,
        // diagonalFactor: 2.55,
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
        skipYOnCenterCellRow: false,
      },
      lattice: {
        strength: 0.8,
        yFactor: 3.5,
        xFactor: 1,
        maxLevelsFromCenter: 30,
        maxRadius: 300,
      },
      origin: {
        strength: 0.8,
        yFactor: 1.5,
      },
    },
  ],
}
