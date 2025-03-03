export const forceSimulationStepConfigs = {
  preview: {
    parameters: {
      // alpha: 0.15,
      // alphaTarget: 0,
      // alphaDecay: 0,
      // alphaMin: 0,
      // velocityDecay: 0.6,
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
          maxLevelsFromCenter: 55,
        },
        origin: {
          enabled: true,
          strength: 0.8,
          yFactor: 1.5,
        },
      },
    ],
  },
  select: {
    parameters: {
      // alpha: 0.35,
      // alphaTarget: 0,
      // alphaDecay: 0,
      // alphaMin: 0,
      velocityDecay: 0.5,
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
          skipYOnCenterCellRow: true,
        },
        lattice: {
          enabled: true,
          strength: 0.8,
          // yFactor: 1.5,
          yFactor: 1.5,
          xFactor: 1,
          maxLevelsFromCenter: 55,
          // xFactor: 2,
        },
        origin: {
          enabled: true,
          strength: 0.1,
        },
      },
      {
        type: 'moveCenterToPoint',
        enabled: true,
        strength: 0.1,
        // yFactor: 1.5,
        // xFactor: 0.8,
        selector: 'focused',
        point: {
          x: undefined,
          y: undefined,
        },
      },
    ],
  },
}
