import { Store } from '../../../common/helpers/store'

export default function simulationStepWorker(SimulationStepClass) {
  let step

  self.onmessage = (e) => {
    const event = e.data
    switch (event.type) {
      case 'init': {
        step = new SimulationStepClass(
          Store.fromSimulationWorkerState(event.state),
        )
        break
      }
      case 'update':
        step.update()
        postMessage({
          type: 'updated',
        })
        break
      case 'setConfig': {
        const config = event.data
        step.store.set('config', config)
        step.setConfig(config)
        break
      }
      case 'updateParameters': {
        const parameters = event.data
        step.updateParameters(parameters, { forceAnimatable: true })
        break
      }
      case 'resize':
        step.store.set('config', event.data.config)
        step.store.get('dimensions').set(event.data.dimensions)
        step.setConfigAndResize(event.data.config)
        postMessage({
          type: 'resized',
        })
        break
    }
  }
}
