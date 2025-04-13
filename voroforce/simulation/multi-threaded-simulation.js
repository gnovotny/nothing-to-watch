import BaseSimulation from './base-simulation'

export default class MultiThreadedSimulation extends BaseSimulation {
  workers = []

  constructor(store, options) {
    super(store, options)

    const workerState = this.store.getSimulationWorkerState()
    this.initForceWorker(workerState)
    this.initVoronoiWorker(workerState)

    for (let i = 0; i < this.workers.length; i++) {
      this.workers[i].addEventListener(
        'message',
        this.handleWorkerEvent.bind(this),
      )
    }
  }

  initVoronoiWorker(workerState) {
    this.voronoiWorker = new Worker(
      new URL('./steps/voronoi-step/worker', import.meta.url),
      {
        type: 'module',
        name: 'voronoi-worker',
      },
    )

    this.voronoiWorker.postMessage({
      type: 'init',
      state: workerState,
    })
    this.workers.push(this.voronoiWorker)
  }

  initForceWorker(workerState) {
    this.forceWorker = new Worker(
      new URL('./steps/forces-step/worker', import.meta.url),
      {
        type: 'module',
        name: 'force-worker',
      },
    )

    this.forceWorker.addEventListener('message', ({ data: { type, data } }) => {
      if (type === 'mediaVersionLayerLoadRequests') {
        const { versionIndex, layers } = data
        this.store.get('loader').requestMediaLayerLoad(versionIndex, layers)
      }
    })

    this.forceWorker.postMessage({
      type: 'init',
      state: workerState,
    })
    this.workers.push(this.forceWorker)
  }

  update() {
    this.updatingWorkersCount = this.workers.length
    for (let i = 0; i < this.workers.length; i++) {
      this.workers[i].postMessage({ type: 'update' })
    }
  }

  resize(dimensions, onResize) {
    this.resizingWorkersCount = this.workers.length

    const config = this.store.getSimulationWorkerConfig()
    for (let i = 0; i < this.workers.length; i++) {
      this.workers[i].postMessage({
        type: 'resize',
        data: {
          config,
          dimensions,
        },
      })
    }

    this.onResize = onResize
  }

  handleDevToolsChange() {
    this.updateForceWorkerConfig()
  }

  handleWorkerEvent({ data: { type } }) {
    switch (type) {
      case 'updated':
        this.onWorkerUpdated()
        break
      case 'resized':
        this.onWorkerResized()
        break
    }
  }

  onWorkerUpdated() {
    this.updatingWorkersCount--
    if (this.updatingWorkersCount === 0) this.onUpdated()
  }

  onWorkerResized() {
    this.resizingWorkersCount--
    if (this.resizingWorkersCount === 0) this.onResize?.()
  }

  updateForceWorkerConfig() {
    this.updateWorkerConfig(this.forceWorker)
  }

  updateWorkerConfig(worker) {
    worker.postMessage({
      type: 'setConfig',
      data: this.store.getSimulationWorkerConfig(),
    })
  }

  handleForceStepConfigUpdated() {
    this.updateForceWorkerConfig()
  }
}
