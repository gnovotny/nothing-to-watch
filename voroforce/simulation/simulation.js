import BaseSimulation from './base-simulation'
import ForcesSimulationStep from './steps/forces-step'
import NeighborsSimulationStep from './steps/neighbors-step'

export default class Simulation extends BaseSimulation {
  constructor(store, options) {
    super(store, options)
    this.forceStep = new ForcesSimulationStep(this.store)
    this.neighborsStep = new NeighborsSimulationStep(this.store)
  }

  update() {
    this.forceStep.update()
    this.neighborsStep.update()

    this.onUpdated()
  }

  handleDevToolsChange() {
    this.forceStep.handleForcesConfig()
  }

  resize(dimensions, onResize) {
    this.forceStep.resize(dimensions)
    this.neighborsStep?.resize(dimensions)
    onResize?.()
  }

  handleForceStepConfigUpdated() {
    this.forceStep.setConfig(this.globalConfig)
  }

  handleForceStepConfigParametersUpdated() {
    this.forceStep.updateParameters(
      this.globalConfig.simulation?.steps?.force?.parameters ?? {},
      { forceAnimatable: true },
    )
  }
}
