import { isNumber } from '../../../utils'
import BaseSimulationStep from '../common/base-simulation-step'
import * as forceFunctions from './forces'
import lcg from './utils/lcg'

const RANDOM = lcg()

export default class ForceSimulationStep extends BaseSimulationStep {
  forces = []

  constructor(store, options) {
    super(store, options)

    this.initMediaProperties()

    this.handleLattice()
    this.initializeCells()
    this.handleForcesConfig()
    this.start()
  }

  updateConfig(config) {
    super.updateConfig(config)
    this.config = config.simulation.steps.force ?? {}
    this.parameters = this.config.parameters
  }

  initMediaProperties() {
    this.mediaConfig = this.globalConfig.media
    if (!this.mediaConfig.enabled) return

    this.sharedLoadedMediaVersionLayersData = this.store.get(
      'sharedLoadedMediaVersionLayersData',
    )

    this.mediaVersionLayerLoadRequests = this.mediaConfig.versions.map(
      () => new Set([]),
    )
  }

  handleForcesConfig() {
    this.forces = []
    let force
    this.config.forces?.forEach(({ type, enabled, ...config }, index) => {
      if (!enabled || !type) return
      force = forceFunctions[type]?.({
        cells: this.cells,
        links: this.links,
        dimensions: this.dimensions,
        pointer: this.pointer,
        config: config,
        simulationStepConfig: this.config,
        simulationConfig: this.simulationConfig,
        globalConfig: this.globalConfig,
        handleEnd:
          index === this.config.forces.length - 1
            ? this.handleEnd.bind(this)
            : undefined,
      })
      if (!force) return
      this.forces.push(force)
    })
  }

  refresh() {
    this.handleLattice()
    this.handleForcesConfig()
  }

  setConfig(config) {
    super.setConfig(config)
  }

  tick() {
    if (this.mediaConfig.enabled) {
      this.mediaVersionLayerLoadRequests.forEach((set) => set.clear())
    }

    for (let i = 0; i < this.forces.length; i++) {
      this.forces[i](this.parameters.alpha)
    }

    this.handleMediaVersionLayerLoadRequests()
  }

  handleEnd(cell) {
    cell.x += cell.vx *= 1 - this.parameters.velocityDecay
    cell.y += cell.vy *= 1 - this.parameters.velocityDecay

    cell.initialVx = cell.vx
    cell.initialVy = cell.vy

    this.handleCellMediaVersion(cell)
  }

  // tick(iterations = 1) {
  //   let i
  //   let cell
  //
  //   // defaults
  //   let {
  //     alpha = 1,
  //     alphaMin = 0.001,
  //     alphaDecay = 1 - alphaMin ** 1 / 300,
  //     alphaTarget = 0,
  //     velocityDecay = 0.6,
  //   } = this.config.parameters
  //
  //   if (this.mediaConfig.enabled) {
  //     this.mediaVersionLayerLoadRequests.forEach((set) => set.clear())
  //   }
  //
  //   for (let k = 0; k < iterations; ++k) {
  //     alpha += (alphaTarget - alpha) * alphaDecay
  //
  //     this.forces.forEach((force) => {
  //       force(alpha)
  //     })
  //
  //     for (i = 0; i < this.numCells; ++i) {
  //       cell = this.cells[i]
  //
  //       // if (isNumber(cell.fx) && isNumber(cell.fy)) {
  //       //   handleCellPins(cell)
  //       // }
  //
  //       if (cell.fx == null) cell.x += cell.vx *= 1 - velocityDecay
  //       else {
  //         cell.x = cell.fx
  //         cell.vx = 0
  //       }
  //       if (cell.fy == null) cell.y += cell.vy *= 1 - velocityDecay
  //       else {
  //         cell.y = cell.fy
  //         cell.vy = 0
  //       }
  //
  //       cell.initialVx = cell.vx
  //       cell.initialVy = cell.vy
  //
  //       this.handleCellMediaVersion(cell)
  //     }
  //   }
  //
  //   this.handleMediaVersionLayerLoadRequests()
  // }

  handleCellMediaVersion(cell) {
    if (!this.mediaConfig.enabled) return

    if (cell.targetMediaVersion !== cell.mediaVersion) {
      const mediaVersion = this.mediaConfig.versions[cell.targetMediaVersion]

      const layerIndex = Math.floor(
        (cell.id / (mediaVersion.cols * mediaVersion.rows)) %
          mediaVersion.layers,
      )

      switch (
        this.sharedLoadedMediaVersionLayersData[cell.targetMediaVersion].data[
          layerIndex
        ]
      ) {
        case 0:
          this.mediaVersionLayerLoadRequests[cell.targetMediaVersion].add(
            layerIndex,
          )
          break
        case 2:
          cell.mediaVersion = cell.targetMediaVersion
          break
      }
    }
  }

  handleMediaVersionLayerLoadRequests() {
    if (!this.mediaConfig.enabled) return

    this.mediaVersionLayerLoadRequests.forEach((set, versionIndex) => {
      if (set.size > 0) {
        const layers = Array.from(set)
        if (this.isWorker) {
          postMessage({
            type: 'mediaVersionLayerLoadRequests',
            data: {
              versionIndex,
              layers,
            },
          })
        } else {
          this.store.get('loader').requestMediaLayerLoad(versionIndex, layers)
        }
      }
    })
  }

  initializeCells() {
    if (this.globalConfig.lattice.enabled) return
    const INITIAL_RADIUS = 10
    const INITIAL_ANGLE = Math.PI * (3 - Math.sqrt(5))

    for (let i = 0, n = this.numCells, cell; i < n; ++i) {
      cell = this.cells[i]
      cell.index = i
      if (cell.fx != null) cell.x = cell.fx
      if (cell.fy != null) cell.y = cell.fy
      if (!isNumber(cell.x) || !isNumber(cell.y)) {
        const radius = INITIAL_RADIUS * Math.sqrt(0.5 + i)
        const angle = i * INITIAL_ANGLE
        cell.x = radius * Math.cos(angle)
        cell.y = radius * Math.sin(angle)
      }
      if (!isNumber(cell.vx) || !isNumber(cell.vy)) {
        cell.vx = cell.vy = 0
      }
    }
  }

  update() {
    this.running && this.tick()
  }

  handleLattice() {
    this.links = []
    const { rows, cols, enabled } = this.globalConfig.lattice
    if (!enabled) return

    let index = 0
    let cell
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        cell = this.cells[index]
        if (!cell) break

        if (row > 0)
          this.links.push({
            source: cell,
            target: this.cells[index - cols],
            type: 'y',
          })
        if (col > 0)
          this.links.push({
            source: cell,
            target: this.cells[index - 1],
            type: 'x',
          })

        index++
      }
    }
  }
}
