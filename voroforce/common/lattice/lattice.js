export function packLattice(cells, latticeConfig, immediate = false) {
  const numCells = cells?.length

  if (numCells <= 0) {
    return cells
  }

  const {
    cellWidth,
    cellHeight,
    rows,
    cols,
    plusHalfSize,
    hexagonal,
    offsetX = 0,
    offsetY = 0,
  } = latticeConfig

  let index = 0
  let cell
  let x
  let y
  for (let row = 0; row < rows; row++) {
    y = row * cellHeight + (plusHalfSize ? cellHeight / 2 : 0)
    y += offsetY

    for (let col = 0; col < cols; col++) {
      cell = cells[index]
      if (!cell) break
      x = col * cellWidth + (plusHalfSize ? cellWidth / 2 : 0)
      x += offsetX

      if (immediate) {
        cell.x = x
        cell.y = y
      }

      cell.ix = x
      cell.iy = y - (hexagonal && col % 2 === 0 ? cellHeight / 2 : 0)
      cell.row = row
      cell.col = col

      // if (links) {
      //   if (row > 0)
      //     links.push({ source: index, target: index - cols, type: 'y' })
      //   if (col > 0) links.push({ source: index, target: index - 1, type: 'x' })
      // }

      index++
    }
  }

  return cells
}

/**
 * Generates subgrids of 18x12 elements from the center outward
 * @param {Object} latticeConfig - Lattice config
 * @param {number} cells - Number of cells to include in subgrids
 * @returns {Array} - Array of subgrid coordinates in [row, col] format
 */
export function generateCenterOutwardSubgridsAndAssignCellIds(
  latticeConfig,
  cells,
) {
  const {
    rows: totalRows,
    cols: totalCols,
    autoTargetMediaVersion2SubgridCount = 0,
    autoTargetMediaVersion1SubgridCount = 0,
  } = latticeConfig

  const elementCount = cells.length
  // Calculate center of grid
  const centerRow = Math.floor(totalRows / 2)
  const centerCol = Math.floor(totalCols / 2)

  const subgridConfig = latticeConfig.subgrid

  // Constants for subgrid dimensions
  const SUBGRID_ROWS = subgridConfig.rows // 18
  const SUBGRID_COLS = subgridConfig.cols // 12
  const SUBGRID_SIZE = SUBGRID_ROWS * SUBGRID_COLS
  const SUBGRID_MAX_SUPPORTED_CAPACITY = subgridConfig.totalCapacity

  // Result array to store coordinates
  const result = []

  // Calculate how many complete subgrids we can create
  const maxCompleteSubgrids = Math.floor(elementCount / SUBGRID_SIZE)
  let remainingElements = elementCount

  // Create spiral pattern for subgrid placement
  // Direction: 0=right, 1=down, 2=left, 3=up
  let direction = 0
  let currentGridRow = 0
  let currentGridCol = 0

  // Calculate subgrid offset in the meta-grid of subgrids
  const subgridOffsetRow = Math.floor(SUBGRID_ROWS / 2)
  const subgridOffsetCol = Math.floor(SUBGRID_COLS / 2)

  // Track visited subgrid positions to create spiral pattern
  const visited = new Set()
  visited.add('0,0') // Mark center as visited

  let currentCellId = 0
  let currentSubgrid = 0
  let currentSubgridIndex = 0

  // Function to add a subgrid
  const addSubgrid = (gridRow, gridCol) => {
    // Calculate top-left corner of this subgrid
    const startRow = centerRow - subgridOffsetRow + gridRow * SUBGRID_ROWS
    const startCol = centerCol - subgridOffsetCol + gridCol * SUBGRID_COLS

    // Add each cell in the subgrid
    for (let r = 0; r < SUBGRID_ROWS && remainingElements > 0; r++) {
      for (let c = 0; c < SUBGRID_COLS && remainingElements > 0; c++) {
        const row = startRow + r
        const col = startCol + c

        // Check if this cell is within the main grid boundaries
        if (row >= 0 && row < totalRows && col >= 0 && col < totalCols) {
          const cellIndex = row * totalCols + col
          const cell = cells[cellIndex]
          if (cell) {
            result.push([row, col])

            currentSubgrid = Math.floor(currentCellId / SUBGRID_SIZE)
            currentSubgridIndex = Math.floor(currentCellId % SUBGRID_SIZE)
            if (!cell.id) {
              cell.id = currentCellId
              cell.subgrid = currentSubgrid // for json and media v2 layers
              cell.subgridIndex = currentSubgridIndex
            }

            if (cell.subgrid < autoTargetMediaVersion2SubgridCount) {
              cell.targetMediaVersion = 2
            } else if (cell.subgrid < autoTargetMediaVersion1SubgridCount) {
              cell.targetMediaVersion = 1
            }

            currentCellId++
            if (currentCellId > SUBGRID_MAX_SUPPORTED_CAPACITY - 1) {
              currentCellId = 0
            }
            remainingElements--
          }
        }
      }
    }

    // currentBatch++
  }

  // Add center subgrid first
  addSubgrid(0, 0)

  // Directions for spiral movement: right, down, left, up
  const dirMovements = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ]

  // Steps to take in each direction before changing
  let stepsInCurrentDirection = 1
  let stepsTaken = 0
  let directionChanges = 0

  // Continue until we've used all elements
  while (remainingElements > 0 && result.length < elementCount) {
    // Move in current direction
    const [rowDelta, colDelta] = dirMovements[direction]
    currentGridRow += rowDelta
    currentGridCol += colDelta
    stepsTaken++

    // Check if this position is valid and not visited
    const posKey = `${currentGridRow},${currentGridCol}`
    if (!visited.has(posKey)) {
      visited.add(posKey)
      addSubgrid(currentGridRow, currentGridCol)
    }

    // Check if we need to change direction
    if (stepsTaken === stepsInCurrentDirection) {
      direction = (direction + 1) % 4
      stepsTaken = 0
      directionChanges++

      // Every two direction changes, increase the steps
      if (directionChanges % 2 === 0) {
        stepsInCurrentDirection++
      }
    }
  }

  return result
}

/**
 * Calculates the optimal lattice layout for displaying cells within a container
 * Ensures complete coverage of the container with minimal overflow
 *
 * @param {number} width - Width of the container
 * @param {number} height - Height of the container
 * @param {number} numCells - Number of cells to display
 * @param {number} cellAspect - Aspect ratio of cells (width/height)
 * @param {number} latticeAspect - Aspect ratio of lattice
 * @param {number} latticeAspectConstraints - Constraints for calculating aspect ratio of lattice
 * @returns {Object} Lattice configuration with columns, rows, rectWidth, rectHeight
 */
function calculateOptimalLattice(
  width,
  height,
  numCells,
  cellAspect,
  latticeAspect,
  latticeAspectConstraints,
) {
  // Container aspect ratio
  // const containerAspect = containerWidth / containerHeight
  // Start with a simple estimate based on the square root of number of cells
  // const initialColumns = Math.round(
  //   Math.sqrt((numCells * containerAspect) / cellAspect),
  // )

  const containerWidth = width
  const containerHeight = height
  // if (latticeAspect === 'min') {
  //   const min = Math.min(width, height)
  //   containerWidth = containerHeight = min
  // }

  // Setting up search parameters
  const maxColumns = Math.min(numCells, Math.ceil(containerWidth))
  const minColumns = 1

  let bestLayout = null
  let minOverflow = Number.POSITIVE_INFINITY

  // Search for the layout that minimizes overflow while ensuring complete coverage
  for (let cols = minColumns; cols <= maxColumns; cols++) {
    const rows = Math.ceil(numCells / cols)

    // Calculate minimum cell dimensions to ensure complete container coverage
    const minCellWidth = containerWidth / cols
    const minCellHeight = containerHeight / rows

    // Adjust dimensions based on aspect ratio while ensuring container coverage
    // Try sizing by width first
    let cellWidth = minCellWidth
    let cellHeight = cellWidth / cellAspect

    // If height doesn't cover container, resize based on height
    if (cellHeight * rows < containerHeight) {
      cellHeight = minCellHeight
      cellWidth = cellHeight * cellAspect
    }

    // Calculate total dimensions and overflow
    const latticeWidth = cellWidth * cols
    const latticeHeight = cellHeight * rows

    // Both dimensions must cover the container
    if (latticeWidth >= containerWidth && latticeHeight >= containerHeight) {
      // Calculate total overflow area
      const overflowWidth = latticeWidth - containerWidth
      const overflowHeight = latticeHeight - containerHeight
      const totalOverflow =
        overflowWidth * latticeHeight +
        overflowHeight * containerWidth -
        overflowWidth * overflowHeight

      // Update best layout if this has less overflow
      if (totalOverflow < minOverflow) {
        minOverflow = totalOverflow
        bestLayout = {
          numCells,
          cols,
          rows,
          cellWidth,
          cellHeight,
          containerWidth,
          containerHeight,
          latticeWidth,
          latticeHeight,
          offsetX: -(latticeWidth - containerWidth) / 2,
          offsetY: -(latticeHeight - containerHeight) / 2,

          // overflowX: overflowWidth,
          // overflowY: overflowHeight,
          // overflowPercent:
          //   (totalOverflow / (containerWidth * containerHeight)) * 100,
        }
      }
    }
  }

  // If no valid layout found (shouldn't happen), create a fallback
  if (!bestLayout) {
    const cellWidth = containerWidth
    const cellHeight = containerHeight
    bestLayout = {
      numCells,
      cols: 1,
      rows: 1,
      cellWidth,
      cellHeight,
      containerWidth,
      containerHeight,
      latticeWidth: cellWidth,
      latticeHeight: cellHeight,
      offsetX: 0,
      offsetY: 0,
      // overflowX: 0,
      // overflowY: 0,
      // overflowPercent: 0,
    }
  }

  return bestLayout
}

export const handleLattice = (globalConfig, cells, width, height) => {
  const config = globalConfig.lattice

  // TODO
  config.subgrid = globalConfig.media.versions
    .filter(({ type }) => !type || type === 'compressed-grid')
    .reduce(
      (prev, mediaVersion = {}) => {
        const layerCapacity = mediaVersion.cols * mediaVersion.rows
        const totalCapacity = Math.min(
          prev.totalCapacity,
          layerCapacity * mediaVersion.layers,
        )

        if (layerCapacity < prev.layerCapacity) {
          return {
            cols: mediaVersion.cols,
            rows: mediaVersion.rows,
            layers: mediaVersion.layers,
            layerCapacity,
            totalCapacity,
          }
        }

        prev.totalCapacity = totalCapacity
        return prev
      },
      {
        layerCapacity: 9999999,
        totalCapacity: 9999999,
      },
    )

  const prevRows = config.rows
  const prevCols = config.cols

  let containerWidth = width
  let containerHeight = height

  // TODO
  if (config.latticeAspect === 1 && config.latticeAspectConstraints === 'min') {
    const min = Math.min(width, height)
    containerWidth = containerHeight = min
  }

  Object.assign(
    config,
    calculateOptimalLattice(
      containerWidth,
      containerHeight,
      cells.length,
      config.aspect,
      config.latticeAspect,
      config.latticeAspectConstraints,
    ),
  )

  // TODO
  config.offsetX =
    -(config.latticeWidth - containerWidth) / 2 - (containerWidth - width) / 2
  config.offsetY =
    -(config.latticeHeight - containerHeight) / 2 -
    (containerHeight - height) / 2

  if (config.targetCellSizeViewportPercentage) {
    const landscape = width > height
    const targetCellSize =
      (landscape ? width : height) * config.targetCellSizeViewportPercentage
    const factor =
      targetCellSize / config[landscape ? 'cellWidth' : 'cellHeight']
    config.cellWidth *= factor
    config.cellHeight *= factor
    config.latticeWidth *= factor
    config.latticeHeight *= factor
    config.offsetX =
      -(config.latticeWidth - containerWidth) / 2 + (containerWidth - width) / 2
    config.offsetY =
      -(config.latticeHeight - containerHeight) / 2 +
      (containerHeight - height) / 2
  }

  generateCenterOutwardSubgridsAndAssignCellIds(config, cells)

  const immediate = prevRows !== config.rows || prevCols !== config.cols

  config.latticeScale = 1 // has no effect on calculations but can be adjusted on the fly and used in the force simulation or fragment shader

  packLattice(cells, config, immediate)
}
