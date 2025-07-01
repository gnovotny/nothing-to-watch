import {
  initSharedCellData,
  initSharedData,
  initSharedLoadedMediaVersionLayersData,
} from './common/data'
import { Dimensions, Loader, Store } from './common/helpers'
import { AutoTicker, ManualTicker } from './common/helpers/ticker'
import { handleLattice } from './common/lattice'
import Controls from './controls'
import { defaultConfig } from './default-config'
import Display from './display'
import { MultiThreadedSimulation, Simulation } from './simulation'
import { mergeConfigs } from './utils'
import { CustomEventTarget } from './utils/custom-event-target'
import { initVisibilityEventHandlers } from './utils/visibility'

export class VisibilityChangeEvent extends Event {
  constructor(visible) {
    super('visibilityChange')
    this.visible = visible
  }
}

export class Voroforce extends CustomEventTarget {
  mediaEnabled = false
  multiThreading = false
  parallelDisplay = false
  simulationWarmedUp = false
  displayWarmedUp = false

  constructor(container, config = {}) {
    super()
    this.config = mergeConfigs(defaultConfig, config)
    this.container = container
    this.init()
  }

  init() {
    this.initDOM()
    this.handleConfig()
    this.initData()
    this.initHelpers()
    this.handleLattice()
    this.initStore()
    this.initComponents()
    this.initEventListeners()
  }

  handleConfig() {
    this.handleMultiThreadingConfig()
    this.handleMediaConfig()
    this.handleTickerConfig()
    this.handleBenchmarkConfig()
  }

  handleMultiThreadingConfig() {
    this.multiThreading =
      this.config.multiThreading?.enabled &&
      typeof SharedArrayBuffer !== 'undefined'

    this.parallelDisplay =
      this.multiThreading && this.config.multiThreading?.renderInParallel
  }

  handleMediaConfig() {
    this.mediaEnabled = this.config.media?.enabled
    if (this.mediaEnabled) {
      // potentially limit the amount of texture memory being allocated
      this.config.media.versions?.forEach((v) => {
        v.layers = Math.min(
          v.layers,
          Math.ceil(this.config.cells / (v.cols * v.rows)),
        )
      })
    }
  }

  handleTickerConfig() {
    this.tickerMode = this.config.ticker?.mode
  }

  handleBenchmarkConfig() {
    this.benchmarkEnabled = this.config.benchmark?.enabled
    if (this.benchmarkEnabled) {
      const originalUpdate = this.update.bind(this)
      this.update = function update() {
        originalUpdate()
        this.benchmark()
      }.bind(this)

      if (this.config.benchmark?.simulation?.enabled) {
        this.multiThreading = false
        this.parallelDisplay = false
      }
    }
  }

  initComponents() {
    this.simulation = new (
      this.multiThreading ? MultiThreadedSimulation : Simulation
    )(this.store, {
      onUpdated: this.onSimulationUpdated.bind(this),
    })
    this.display = new Display(this.store)
    this.controls = new Controls(this.store, this.display)
  }

  initHelpers() {
    void this.initDevTools()
    this.dimensions = new Dimensions(this.container)
    this.ticker = new (this.tickerMode === 'auto' ? AutoTicker : ManualTicker)(
      this.devTools?.fpsGraph,
    )

    this.loader = new Loader(
      this.sharedLoadedMediaVersionLayersData,
      this.config,
    )
  }

  initData() {
    this.sharedData = initSharedData(this.config)
    // this.sharedPointer = initSharedPointer(this.config)
    this.sharedCellData = initSharedCellData(
      this.config.cells ?? 512,
      this.config,
    )
    this.cells = this.sharedCellData.cells

    if (this.mediaEnabled) {
      this.sharedLoadedMediaVersionLayersData =
        initSharedLoadedMediaVersionLayersData(this.config)
    }
  }

  initDOM() {
    this.canvas = this.container.getElementsByTagName('canvas')[0]
  }

  handleLattice() {
    handleLattice(
      this.config,
      this.cells,
      this.dimensions.width,
      this.dimensions.height,
    )
  }

  initStore() {
    this.store = new Store({
      container: this.container,
      canvas: this.canvas,
      config: this.config,
      dimensions: this.dimensions,
      ticker: this.ticker,
      loader: this.loader,
      controls: this.controls,
      ...this.sharedData,
      // ...this.sharedPointer,
      ...this.sharedCellData,
      ...this.sharedLoadedMediaVersionLayersData,
    })
    this.loader.store = this.store // TODO
  }

  start() {
    this.simulationWarmedUp = false
    this.displayWarmedUp = false
    this.ticker.start()
    return this
  }

  initEventListeners() {
    this.resize = this.resize.bind(this)
    this.update = this.update.bind(this)
    this.dimensions.addEventListener('resize', this.resize)
    this.ticker.addEventListener('tick', this.update)

    // TODO
    if (this.config.handleVisibilityChange?.enabled) {
      initVisibilityEventHandlers(
        () => {
          console.log('window visible')
          this.visible = true
          clearTimeout(this.tickerFreezeTimeout)
          this.ticker.start()
          this.dispatchEvent(
            new VisibilityChangeEvent({
              visible: true,
            }),
          )
        },
        () => {
          console.log('window hidden')
          this.visible = false
          this.dispatchEvent(
            new VisibilityChangeEvent({
              visible: false,
            }),
          )
          clearTimeout(this.tickerFreezeTimeout)
          this.tickerFreezeTimeout = setTimeout(() => {
            if (this.visible) return
            console.log('window hidden freeze')
            this.ticker.stop()
          }, this.config.handleVisibilityChange.hiddenDelay)
        },
      )
    }

    // setTimeout drift detection
    let last = performance.now()
    setInterval(() => {
      const now = performance.now()
      const diff = now - last
      last = now

      if (this.config.handleVisibilityChange?.enabled && !this.visible) return

      if (diff > 2000) {
        if (this.ticker.running) {
          // System probably suspended or throttled
          console.log('Throttling or sleep detected')
          this.ticker.stop()
        }
      } else {
        if (!this.ticker.running) {
          console.log('Resuming from sleep or throttling')
          this.ticker.start()
        }
      }
    }, 1000)
  }

  async initDevTools(force = false) {
    if (this.devTools) return
    this.config.devTools.enabled =
      force || this.config.devTools.enabled || window.location.hash === '#dev'

    if (!this.config.devTools.enabled) return
    this.devTools = new (await import('./common/dev-tools')).default(
      this.config.devTools,
    )
    this.ticker.fpsGraph = this.devTools.fpsGraph
    this.store.set('devTools', this.devTools)
  }

  // multithreaded simulation step workers must complete before triggering resize
  deferredResize() {
    this.ticker.stop()
    this.handleLattice()
    const dimensions = this.store.get('dimensions').get()
    this.controls.startResize()
    this.simulation.resize(dimensions, () => {
      this.pendingResize = false
      this.display.resize(dimensions)
      this.controls.endResize(dimensions)
      this.start()
    })
  }

  resize() {
    this.pendingResize = true
  }

  update() {
    this.updateControls()
    this.updateSimulation()
    if (this.parallelDisplay) this.updateDisplay()
  }

  updateSimulation() {
    this.simulation.update()
  }

  onSimulationUpdated() {
    this.simulationWarmedUp = true

    if (!this.parallelDisplay) this.updateDisplay()

    // multithreaded simulation step workers must complete before triggering resize
    if (this.pendingResize) {
      this.deferredResize()
      return
    }

    if (this.tickerMode === 'manual') this.ticker.next()
  }

  updateDisplay() {
    if (this.simulationWarmedUp) {
      this.display.update()
      this.displayWarmedUp = true
    }
    if (this.tickerMode === 'manual') this.ticker.next()
  }

  updateControls() {
    if (this.displayWarmedUp) this.controls.update()
  }

  updates = 0
  benchmark() {
    this.updates++
    if (!this.displayWarmedUp || this.updates < 10) {
      return
    }
    this.ticker.kill()
    this.simulation.onUpdated = () => {}

    if (this.config.benchmark?.simulation?.enabled) {
      this.benchmarkSimulation()
    }
    if (this.config.benchmark?.display?.enabled) {
      this.benchmarkDisplay()
    }
  }

  benchmarkSimulation() {
    let sTotal = 0
    for (
      let i = 0;
      i < (this.config.benchmark?.simulation?.iterations || 100);
      i++
    ) {
      const s = Date.now()
      this.simulation.update()
      sTotal += Date.now() - s
    }

    console.log('Simulation total: ', sTotal)
  }

  benchmarkDisplay() {
    let sTotal = 0
    for (
      let i = 0;
      i < (this.config.benchmark?.display?.iterations || 100);
      i++
    ) {
      const s = Date.now()
      this.display.update()
      sTotal += Date.now() - s
    }

    console.log('Display total: ', sTotal)
  }

  removeEventListeners() {
    this.ticker.removeEventListener('tick', this.update)
    this.dimensions.removeEventListener('resize', this.resize)
  }

  disposeDevTools() {
    this.config.devTools.enabled = false

    this.ticker.fpsGraph = undefined
    this.devTools?.dispose()
    this.devTools = undefined
    this.store.set('devTools', undefined)
  }

  // TODO
  dispose() {
    this.removeEventListeners()
    this.disposeDevTools()
    this.simulation.dispose()
    this.display.dispose()
    this.controls.dispose()
    this.dimensions.dispose()
    this.ticker.dispose()
    this.loader.dispose()
    this.store.dispose()
  }
}

export default function voroforce(container, config) {
  return new Voroforce(container, config).start()
}
