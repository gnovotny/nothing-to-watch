import BaseSimulation from './base-simulation'
import ForceSimulationStep from './steps/force'
import VoronoiSimulationStep from './steps/voronoi'

export default class Simulation extends BaseSimulation {
  constructor(store, options) {
    super(store, options)
    this.forceStep = new ForceSimulationStep(this.store)
    this.voronoiStep = new VoronoiSimulationStep(this.store)
  }

  update() {
    this.forceStep.update()
    this.voronoiStep.update()

    this.onUpdated()
  }

  handleDevToolsChange() {
    this.forceStep.handleForcesConfig()
  }

  resize(dimensions, onResize) {
    this.forceStep.resize(dimensions)
    this.voronoiStep?.resize(dimensions)
    onResize?.()
  }

  handleForceStepConfigUpdated() {
    this.forceStep.setConfig(this.globalConfig)
  }
}
