import {
  initSharedCellData,
  initSharedData,
  initSharedLoadedMediaVersionLayersData,
} from './common/data'
import { Dimensions, Loader, Store, Ticker } from './common/helpers'
import { handleLattice } from './common/lattice'
import baseConfig from './config'
import { Controls } from './controls/controls.js'
import Display from './display'
import { MultiThreadedSimulation } from './simulation'
import { isTouchDevice, mergeConfigs } from './utils'
import { initVisibilityEventHandlers } from './utils/visibility'

export class Voroforce {
  mediaEnabled = false
  multiThreading = false
  renderInParallel = false
  simulationIsWarm = false

  constructor(container, config = {}) {
    this.config = mergeConfigs(baseConfig, config)
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
    void this.initDevTools()
  }

  handleConfig() {
    this.handleMultiThreadingConfig()
    this.handleMediaConfig()
  }

  handleMultiThreadingConfig() {
    const mTConfig = this.config.multiThreading
    if (!mTConfig?.enabled) return

    this.multiThreading = true // hardcoded
    this.renderInParallel = mTConfig.renderInParallel
  }

  handleMediaConfig() {
    this.mediaEnabled = this.config.media?.enabled
  }

  initComponents() {
    // hardcoded
    this.simulation = new MultiThreadedSimulation(this.store, {
      onUpdated: this.onSimulationUpdated.bind(this),
    })
    this.display = new Display(this.store)
    this.controls = new Controls(this.store, this.display)
  }

  initHelpers() {
    this.dimensions = new Dimensions(this.container)
    this.ticker = new Ticker()
    if (this.mediaEnabled) {
      this.loader = new Loader(
        this.sharedLoadedMediaVersionLayersData,
        this.config,
      )
    }
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
      this.config.lattice,
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
  }

  start() {
    this.simulationIsWarm = false
    this.displayIsWarm = false
    this.ticker.next()
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
    if (isTouchDevice) this.config.devTools.expanded = false
    this.devTools = new (await import('./common/dev-tools')).default(
      this.config.devTools,
    )
    this.store.set('devTools', this.devTools)
  }

  // multithreaded simulation step workers must complete before triggering resize
  deferredResize() {
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

    if (this.multiThreading && this.renderInParallel) {
      this.updateDisplay()
    }
  }

  updateSimulation() {
    this.simulation.update()
  }

  onSimulationUpdated() {
    this.simulationIsWarm = true

    if (!this.multiThreading || !this.renderInParallel) {
      this.updateDisplay()
    }

    if (this.pendingResize) {
      this.deferredResize()
      return
    }

    this.devTools?.fpsGraph?.end()
    this.ticker.next()
  }

  updateDisplay() {
    if (!this.simulationIsWarm) return
    this.display.update()
    this.displayIsWarm = true
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
    this.simulation = null
    this.display.dispose()
    this.display = null
    this.controls.dispose()
    this.controls = null

    this.dimensions.dispose()
    this.dimensions = null
    this.ticker.dispose()
    this.ticker = this.loader.dispose()
    this.loader = null

    this.config = null
    this.cells = null

    this.store.dispose()
    this.store = null

    this.devTools?.dispose()
    this.devTools = null
  }
}

export default function voroforce(container, config) {
  return new Voroforce(container, config).start()
}
