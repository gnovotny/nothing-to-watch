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
    {
      type: 'superF',
      enabled: true,
      push: {
        enabled: true,
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
        skipYOnCenterCellRow: true,
      },
      lattice: {
        enabled: true,
        strength: 0.8,
        // yFactor: 1.5,
        yFactor: 3.5,
        xFactor: 1,
        maxLevelsFromCenter: 25,
      },
      origin: {
        enabled: true,
        strength: 0.8,
        yFactor: 1.5,
      },
    },
  ],
}
