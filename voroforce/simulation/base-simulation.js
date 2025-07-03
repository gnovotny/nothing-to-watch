import { mergeConfigs } from '../index.js'
import { defaultForceSimulationStepConfig } from './default-simulation-config.js'
import { setupDevTools } from './utils/dev-tools'

export default class BaseSimulation {
  constructor(store, { onUpdated = () => {} } = { onUpdated: () => {} }) {
    this.onUpdated = onUpdated
    this.initGlobals(store)
    this.initProperties()
    this.initDevTools()
  }

  initGlobals(store) {
    this.store = store
    this.globalConfig = this.store.get('config')
    this.config = this.globalConfig.simulation
  }

  initProperties() {
    this.container = this.store.get('container')
    this.dimensions = this.store.get('dimensions')
    this.cells = this.store.get('cells')
  }

  initDevTools() {
    this.handleDevTools = ({ value: devTools }) => {
      if (!devTools) return
      setupDevTools(
        devTools,
        () => this.handleDevToolsChange(),
        this.config,
        this.globalConfig,
      )
    }
    this.store.addEventListener('devTools', this.handleDevTools)
  }

  handleDevToolsChange() {}

  update() {}

  resize(dimensions) {}

  updateForceStepConfig(config) {
    this.config.steps.force = mergeConfigs(
      defaultForceSimulationStepConfig,
      config,
    )
    this.handleForceStepConfigUpdated()
  }

  updateForceStepConfigParameters(parameters) {
    this.config.steps.force.parameters = mergeConfigs(
      defaultForceSimulationStepConfig.parameters,
      parameters,
    )
    this.handleForceStepConfigParametersUpdated()
  }

  handleForceStepConfigUpdated() {}
  handleForceStepConfigParametersUpdated() {}

  dispose() {}
}
