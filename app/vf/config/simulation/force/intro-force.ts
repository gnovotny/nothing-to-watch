export const introForceSimulationStepConfig = {
  parameters: {
    animatable: true,
    alpha: 0.8,
    velocityDecay: 0.8,
    velocityDecayBase: 0.8,
    velocityDecayTransitionEnterMode: 0.8,
  },
  forces: [
    {
      type: 'origin',
      enabled: true,
      strength: 0.05,
    },
  ],
}
