import {
  initSharedCellData,
  initSharedData,
  initSharedLoadedMediaVersionLayersData,
} from './common/data'
import { Dimensions, Loader, Store, AutoTicker } from './common/helpers'
import { handleLattice } from './common/lattice'
import { defaultConfig } from './default-config'
import Controls from './controls'
import Display from './display'
import { MultiThreadedSimulation, Simulation } from './simulation'
import { mergeConfigs } from './utils'
import { initVisibilityEventHandlers } from './utils/visibility'
import { ManualTicker } from './common/helpers/ticker'

export class Voroforce {
  mediaEnabled = false
  multiThreading = false
  parallelDisplay = false
  simulationIsWarm = false
  displayIsWarm = false

  constructor(container, config = {}) {
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
      ...this.sharedCellData,
      ...this.sharedLoadedMediaVersionLayersData,
    })
    this.loader.store = this.store // TODO TMP?
  }

  start() {
    this.simulationIsWarm = false
    this.displayIsWarm = false
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
          console.log('visible')
          this.visible = true
          this.ticker.unfreeze()
          this.ticker.next()
        },
        () => {
          console.log('hidden')
          this.visible = false

          if (this.config.handleVisibilityChange.hiddenDelay > 0) {
            setTimeout(() => {
              if (this.visible) return
              console.log('frozen')
              this.ticker.freeze()
            }, this.config.handleVisibilityChange.hiddenDelay)
          } else {
            this.ticker.freeze()
          }
        },
      )
    }
  }

  async initDevTools() {
    this.config.devTools.enabled =
      this.config.devTools.enabled || window.location.hash === '#dev'

    if (!this.config.devTools.enabled) return
    this.devTools = new (await import('./common/dev-tools')).default(
      this.config.devTools,
    )
    this.ticker.fpsGraph = this.devTools.fpsGraph
    this.store.set('devTools', this.devTools)
  }

  // multithreaded simulation step workers must complete before triggering resize
  deferredResize() {
    if (this.tickerMode === 'auto') this.ticker.stop()
    this.handleLattice()
    const dimensions = this.store.get('dimensions').get()
    this.simulation.resize(dimensions, () => {
      this.pendingResize = false
      this.display.resize(dimensions)
      this.start()
    })
    this.controls.resize(dimensions)
  }

  resize() {
    this.pendingResize = true
  }

  update() {
    this.devTools?.fpsGraph?.begin()

    this.updateControls()
    this.updateSimulation()

    if (this.parallelDisplay) this.updateDisplay()
  }

  updateSimulation() {
    this.simulation.update()
  }

  onSimulationUpdated() {
    this.simulationIsWarm = true

    if (!this.parallelDisplay) this.updateDisplay()

    // multithreaded simulation step workers must complete before triggering resize
    if (this.pendingResize) {
      this.deferredResize()
      return
    }

    // this.devTools?.fpsGraph?.end()
    if (this.tickerMode === 'manual') this.ticker.next()
  }

  updateDisplay() {
    if (this.simulationIsWarm) {
      this.display.update()
      this.displayIsWarm = true
    }
    if (this.tickerMode === 'manual') this.ticker.next()
  }

  updateControls() {
    if (this.displayIsWarm) this.controls.update()
  }

  removeEventListeners() {
    this.ticker.removeEventListener('tick', this.update)
    this.dimensions.removeEventListener('resize', this.resize)
  }

  // TODO
  dispose() {
    this.removeEventListeners()
    this.simulation.dispose()
    this.display.dispose()
    this.controls.dispose()
    this.dimensions.dispose()
    this.ticker.dispose()
    this.loader.dispose()
    this.store.dispose()
    this.devTools?.dispose()
  }
}

export default function voroforce(container, config) {
  return new Voroforce(container, config).start()
}
