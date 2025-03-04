export const forceSimulationStepIntroConfig = {
  parameters: {
    alpha: 0.8,
    velocityDecay: 0.8,
    velocityDecayBase: 0.8,
    velocityDecayTransitionEnterMode: 0.8,
  },
  forces: [
    {
      type: 'superF',
      enabled: true,
      push: {
        enabled: false,
      },
      origin: {
        enabled: true,
        strength: 0.1,
      },
    },
  ],
}
