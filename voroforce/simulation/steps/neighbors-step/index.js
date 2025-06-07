import BaseSimulationStep from '../common/base-simulation-step'

export default class NeighborsSimulationStep extends BaseSimulationStep {
  neighborsNeedUpdate = true
  constructor(store, options) {
    super(store, options)
    this.refresh()
    this.start()
  }

  updateConfig(config) {
    super.updateConfig(config)
    this.config = config.simulation.steps.neighbors ?? {}
  }

  initProperties() {
    super.initProperties()
    this.cellNeighbors = this.store.get('sharedCellNeighbors')
  }

  refresh() {
    super.refresh()
    this.neighborLevels = this.config.levels ?? 1
    this.neighborsNeedUpdate = true
  }

  update() {
    if (this.neighborsNeedUpdate) {
      this.updateNeighbors()
      this.neighborsNeedUpdate = false
    }
    super.update()
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

            // Only include cells exactly at this level
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

      this.cellNeighbors[i * 2] = currentDataIndex
      this.cellNeighbors.set(neighbors, currentDataIndex)
      this.cellNeighbors[i * 2 + 1] = neighbors.length
      currentDataIndex += neighbors.length
    }
  }
}
