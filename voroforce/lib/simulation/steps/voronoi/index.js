import BaseSimulationStep from '../common/base-simulation-step'
import {
  LATTICE_DIRECTIONS,
  getNeighborIndexByLatticeOffset,
} from './utils/lattice'
import { easedMinLerp } from './utils/math'

export default class VoronoiSimulationStep extends BaseSimulationStep {
  neighborsNeedUpdate = true
  weightsNeedUpdate = false
  lastKnownFocusedCellIndex = undefined
  activeWeightsMap = new Map()
  constructor(store, options) {
    super(store, options)
    this.refresh()
    this.start()
  }

  updateConfig(config) {
    super.updateConfig(config)
    this.config = config.simulation.steps.voronoi ?? {}
  }

  initProperties() {
    super.initProperties()
    this.cellNeighbors = this.store.get('sharedCellNeighbors')
    this.cellWeights = this.store.get('sharedCellWeights')
  }

  refresh() {
    super.refresh()
    this.neighborLevels = this.config.latticeNeighborLevels ?? 1
    this.neighborsNeedUpdate = true
    this.weightsNeedUpdate = this.globalConfig.cellWeightsTexture?.enabled
  }

  update() {
    if (this.neighborsNeedUpdate) {
      this.updateNeighbors()
      this.neighborsNeedUpdate = false
    }

    // let {
    //   alpha = 1,
    //   alphaMin = 0.001,
    //   alphaDecay = 1 - alphaMin ** 1 / 300,
    //   alphaTarget = 0,
    //   velocityDecay = 0.6,
    // } = this.config.parameters
    // alpha += (alphaTarget - alpha) * alphaDecay

    // if (this.weightsNeedUpdate) {
    this.updateWeights(/*alpha, velocityDecay*/)
    // }

    super.update()
  }

  updateWeights(/*alpha, velocityDecay*/) {
    const baseFocusedWeight = this.config.baseFocusedWeight
    if (!baseFocusedWeight) return
    const baseFocusedDirectXNeighborWeight =
      this.config.baseFocusedDirectXNeighborWeight ?? 0

    const cellWidth = this.globalConfig.lattice.cellWidth

    const focusedCell = this.cells.focused
    const focusedCellIndex = focusedCell?.index
    let focusedCellLeftNeighborIndex
    let focusedCellRightNeighborIndex

    if (focusedCellIndex !== undefined) {
      focusedCellLeftNeighborIndex =
        this.cells[focusedCellIndex - 1]?.row === this.cells.focused.row
          ? focusedCellIndex - 1
          : undefined
      focusedCellRightNeighborIndex =
        this.cells[focusedCellIndex + 1]?.row === this.cells.focused.row
          ? focusedCellIndex + 1
          : undefined

      if (this.lastKnownFocusedCellIndex !== focusedCellIndex) {
        if (!this.activeWeightsMap.has(focusedCellIndex)) {
          this.activeWeightsMap.set(focusedCellIndex, {
            value: 0,
            lI: focusedCellLeftNeighborIndex,
            rI: focusedCellRightNeighborIndex,
          })
        }

        if (baseFocusedDirectXNeighborWeight) {
          ;[
            focusedCellLeftNeighborIndex,
            focusedCellRightNeighborIndex,
          ].forEach((neighborIndex) => {
            if (neighborIndex !== undefined) {
              if (!this.activeWeightsMap.has(neighborIndex)) {
                this.activeWeightsMap.set(neighborIndex, {
                  value: 0,
                  lI:
                    this.cells[neighborIndex - 1]?.row === focusedCell.row
                      ? neighborIndex - 1
                      : undefined,
                  rI:
                    this.cells[neighborIndex + 1]?.row === focusedCell.row
                      ? neighborIndex + 1
                      : undefined,
                })
              }
            }
          })
        }
      }
    }

    this.lastKnownFocusedCellIndex = focusedCellIndex

    this.activeWeightsMap.forEach((item, key) => {
      const { value, lI: leftIndex, rI: rightIndex } = item
      if (key === focusedCellIndex) {
        const cellLeftNeighborX =
          leftIndex !== undefined
            ? this.cells[leftIndex].x
            : this.cells[rightIndex].x
        const cellRightNeighborX =
          rightIndex !== undefined
            ? this.cells[rightIndex].x
            : this.cells[leftIndex].x
        const avgXDist =
          Math.abs(focusedCell.x - cellLeftNeighborX) +
          Math.abs(focusedCell.x - cellRightNeighborX)
        const wMod = avgXDist / cellWidth
        const focusedWeight = baseFocusedWeight * wMod
        // console.log('wMod', wMod)
        // console.log('focusedWeight', focusedWeight)
        if (value !== focusedWeight) {
          const newValue = easedMinLerp(value, focusedWeight, 0.025)
          item.value = newValue
          this.cellWeights[key] = newValue
        }
      } else if (
        baseFocusedDirectXNeighborWeight &&
        (key === focusedCellLeftNeighborIndex ||
          key === focusedCellRightNeighborIndex)
      ) {
        const cellLeftNeighborX =
          leftIndex !== undefined
            ? this.cells[leftIndex].x
            : this.cells[rightIndex].x
        const cellRightNeighborX =
          rightIndex !== undefined
            ? this.cells[rightIndex].x
            : this.cells[leftIndex].x
        const avgXDist =
          Math.abs(this.cells[key].x - cellLeftNeighborX) +
          Math.abs(this.cells[key].x - cellRightNeighborX)
        const wMod = avgXDist / cellWidth

        const focusedDirectXNeighborWeight =
          baseFocusedDirectXNeighborWeight * wMod
        if (value !== focusedDirectXNeighborWeight) {
          const newValue = easedMinLerp(
            value,
            focusedDirectXNeighborWeight,
            0.025,
          )
          item.value = newValue
          this.cellWeights[key] = newValue
        }
      } else {
        if (value === 0) {
          this.activeWeightsMap.delete(key)
        } else {
          // const newValue = Math.max(0, lerp(value, 0, 0.1))
          const newValue = easedMinLerp(value, 0, 0.025)
          item.value = newValue
          this.cellWeights[key] = newValue
        }
      }
    })
  }

  updateNeighborsOld() {
    let cell
    let currentDataIndex
    let neighbors

    currentDataIndex = this.numCells * 2

    for (let i = 0; i < this.numCells; i++) {
      cell = this.cells[i]
      neighbors = []

      // populate first-level neighbors in a separate loop for adjacency and clockwise order
      LATTICE_DIRECTIONS.forEach(([dx, dy]) => {
        const neighborLatticeCol = cell.col + dx
        const neighborLatticeRow = cell.row + dy

        const neighborIndex = getNeighborIndexByLatticeOffset(
          neighborLatticeCol,
          neighborLatticeRow,
          this.globalConfig.lattice,
        )
        if (neighborIndex >= 0) {
          if (!neighbors.includes(neighborIndex)) {
            neighbors.push(neighborIndex)
          }
        }
      })

      if (this.neighborLevels > 1) {
        LATTICE_DIRECTIONS.forEach(([dx, dy]) => {
          const neighborLatticeCol = cell.col + dx
          const neighborLatticeRow = cell.row + dy

          const neighborIndex = getNeighborIndexByLatticeOffset(
            neighborLatticeCol,
            neighborLatticeRow,
            this.globalConfig.lattice,
          )
          if (neighborIndex >= 0) {
            const cell = this.cells[neighborIndex]
            LATTICE_DIRECTIONS.forEach(([dx, dy]) => {
              const neighborLatticeCol = cell.col + dx
              const neighborLatticeRow = cell.row + dy

              const neighborNeighborIndex = getNeighborIndexByLatticeOffset(
                neighborLatticeCol,
                neighborLatticeRow,
                this.globalConfig.lattice,
              )
              if (neighborNeighborIndex >= 0) {
                if (this.neighborLevels > 2) {
                  const cell = this.cells[neighborNeighborIndex]
                  LATTICE_DIRECTIONS.forEach(([dx, dy]) => {
                    const neighborLatticeCol = cell.col + dx
                    const neighborLatticeRow = cell.row + dy

                    const neighborNeighborIndex =
                      getNeighborIndexByLatticeOffset(
                        neighborLatticeCol,
                        neighborLatticeRow,
                        this.globalConfig.lattice,
                      )
                    if (neighborNeighborIndex >= 0) {
                      if (
                        neighborNeighborIndex !== i &&
                        !neighbors.includes(neighborNeighborIndex)
                      ) {
                        neighbors.push(neighborNeighborIndex)
                      }
                    }
                  })
                }

                if (
                  neighborNeighborIndex !== i &&
                  !neighbors.includes(neighborNeighborIndex)
                ) {
                  neighbors.push(neighborNeighborIndex)
                }
              }
            })
          }
        })
      }

      try {
        this.cellNeighbors[i * 2] = currentDataIndex
        this.cellNeighbors.set(neighbors, currentDataIndex)
        this.cellNeighbors[i * 2 + 1] = neighbors.length
        currentDataIndex += neighbors.length
      } catch (e) {
        console.log('currentDataIndex', currentDataIndex)
        console.log('neighbors.length', neighbors.length)
        console.log('i', i)
        console.log('neighbors', neighbors)
        throw e
      }
    }
  }

  updateNeighbors() {
    /**
     * Get neighboring indices for a given position in a grid, ordered by level
     * @param {number} index - Current position index
     * @param {number} columns - Number of columns in the grid
     * @param {number} rows - Number of rows in the grid
     * @param {number} level - How many cells out to look for neighbors (default: 1)
     * @returns {number[]} Array of neighboring indices, ordered by level
     */
    function getGridNeighbors(index, columns, rows, level = 1) {
      // Validate input parameters
      if (index < 0 || index >= columns * rows) {
        throw new Error('Invalid index')
      }

      const neighbors = []
      const currentRow = Math.floor(index / columns)
      const currentCol = index % columns

      // Loop through each level sequentially
      for (let l = 1; l <= level; l++) {
        const currentLevelNeighbors = []

        // Check all positions around the current cell at the current level
        for (let row = -l; row <= l; row++) {
          for (let col = -l; col <= l; col++) {
            // Skip if this is the center cell
            if (row === 0 && col === 0) continue

            // Only include cells exactly at this level (Manhattan distance)
            if (Math.max(Math.abs(row), Math.abs(col)) !== l) continue

            const newRow = currentRow + row
            const newCol = currentCol + col

            // Check if the position is within bounds
            if (
              newRow >= 0 &&
              newRow < rows &&
              newCol >= 0 &&
              newCol < columns
            ) {
              const neighborIndex = newRow * columns + newCol
              currentLevelNeighbors.push(neighborIndex)
            }
          }
        }

        // Add current level neighbors in sorted order
        neighbors.push(...currentLevelNeighbors.sort((a, b) => a - b))
      }

      return neighbors
    }

    let cell
    let currentDataIndex
    let neighbors

    const { rows, cols, numCells } = this.globalConfig.lattice
    currentDataIndex = numCells * 2

    for (let i = 0; i < numCells; i++) {
      cell = this.cells[i]
      neighbors = getGridNeighbors(i, cols, rows, this.neighborLevels)

      try {
        this.cellNeighbors[i * 2] = currentDataIndex
        this.cellNeighbors.set(neighbors, currentDataIndex)
        this.cellNeighbors[i * 2 + 1] = neighbors.length
        currentDataIndex += neighbors.length
      } catch (e) {
        console.log('currentDataIndex', currentDataIndex)
        console.log('neighbors.length', neighbors.length)
        console.log('i', i)
        console.log('neighbors', neighbors)
        throw e
      }
    }
  }
}
