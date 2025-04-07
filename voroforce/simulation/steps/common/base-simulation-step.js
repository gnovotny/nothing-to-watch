export default class BaseSimulationStep {
  constructor(store) {
    this.initGlobals(store)
    this.initProperties()
  }

  initGlobals(store) {
    this.store = store
    this.updateConfig(this.store.get('config'))
  }

  updateConfig(config) {
    this.globalConfig = config
    this.simulationConfig = config.simulation
    this.config = {}
  }

  initProperties() {
    this.dimensions = this.store.get('dimensions')
    this.cells = this.store.get('cells')
    this.numCells = this.cells.length
    this.pointer = this.store.get('sharedPointer')
    this.sharedData = this.store.get('sharedData')

    this.isWorker =
      typeof WorkerGlobalScope !== 'undefined' &&
      self instanceof WorkerGlobalScope
  }

  refresh() {}

  resize(dimensions) {
    this.refresh()
  }

  setConfig(config) {
    this.updateConfig(config)
    this.refresh()
  }

  setConfigAndResize(config) {
    this.updateConfig(config)
    this.refresh()
  }

  update() {}

  dispose() {}

  start() {
    this.running = true
  }

  stop() {
    this.running = false
  }
}
