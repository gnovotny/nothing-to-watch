import { isNumber } from '../../../../utils'

/**
 * Calculates weights for neighboring points based on their distance from a center point.
 * Points closer to the center receive higher weights.
 *
 * @param {Object} centerPoint - The reference center point with x and y coordinates
 * @param {Array} neighborPoints - Array of points (each with x and y coordinates)
 * @param {Object} options - Optional parameters
 * @param {String} options.method - Weighting method: 'inverse' (default), 'inverse-squared', or 'gaussian'
 * @param {Number} options.sigma - Sigma value for gaussian method (default: 1)
 * @param {Boolean} options.normalize - Whether to normalize weights to sum to 1 (default: true)
 * @returns {Array} Array of objects containing the original points and their calculated weights
 */
function calculatePointWeights(centerPoint, neighborPoints, options = {}) {
  const { method = 'inverse', sigma = 1, normalize = true } = options

  // Calculate Euclidean distance between two points
  const calculateDistance = (p1, p2) => {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
  }

  // Calculate weights based on distances
  const weightedPoints = neighborPoints.map((point) => {
    const distance = calculateDistance(centerPoint, point)
    let weight

    switch (method) {
      case 'inverse-squared':
        // Inverse square law (1/d²)
        weight = distance === 0 ? Number.MAX_VALUE : 1 / distance ** 2
        break
      case 'gaussian':
        // Gaussian function: exp(-d²/2σ²)
        weight = Math.exp(-(distance ** 2) / (2 * sigma ** 2))
        break
      default: // case 'inverse':
        // Simple inverse distance (1/d)
        weight = distance === 0 ? Number.MAX_VALUE : 1 / distance
        break
    }

    point.distance = distance
    point.weight = weight

    return point
  })

  // Normalize weights to sum to 1 if requested
  if (normalize) {
    const totalWeight = weightedPoints.reduce((sum, wp) => sum + wp.weight, 0)
    weightedPoints.forEach((wp) => {
      wp.weight = wp.weight / totalWeight
    })
  }

  return weightedPoints
}

export const superForce = ({
  cells,
  dimensions,
  pointer,
  config: {
    push: {
      strength: _pushStrength = 1,
      pushStrength = _pushStrength * 0.1,
      selector: pushSelector = 'focused',
      pointerFollow: pushPointerFollow = {
        enabled: false,
        scaling: 0.25,
        y: true,
        x: true,
      },
      pointerFollowAlt: pushPointerFollowAlt = {
        enabled: false,
        scaling: 0.25,
        y: true,
        x: true,
      },
      radius: pushRadius = dimensions.get('diagonal'),
      xFactor: pushXFactor = 1,
      yFactor: pushYFactor = 1,
      diagonalFactor: pushDiagonalFactor = 1,
      requestMediaVersions: pushRequestMediaVersions = true,
      centerMagic: pushCenterMagic = false,
    } = {},
    lattice: {
      strength: latticeStrength = 0.8,
      xFactor: latticeXFactor = 1,
      yFactor: latticeYFactor = 1,
      maxLevelsFromCenter: latticeMaxLevelsFromCenter = 4,
    } = {},
    origin: {
      strength: originStrength = 0.8,
      xFactor: originXFactor = 1,
      yFactor: originYFactor = 1,
    } = {},
  },
  handleEnd,
  globalConfig,
}) => {
  let centerCell,
    previousCenterCell,
    centerX,
    centerY,
    targetCenterX,
    targetCenterY,
    centerCellX,
    centerCellY,
    i,
    cell,
    x,
    y,
    l,
    mediaV1DistThreshold,
    mediaV2DistThreshold,
    mediaV1LevelAdjacencyThreshold,
    mediaV2LevelAdjacencyThreshold,
    colLevelAdjacency,
    rowLevelAdjacency,
    maxLevelAdjacency,
    latticeCellWidth = globalConfig.lattice.cellWidth,
    latticeCellHeight = globalConfig.lattice.cellHeight,
    minLatticeRow,
    maxLatticeRow,
    minLatticeCol,
    maxLatticeCol,
    latticeRow,
    latticeCol,
    latticeStrengthMod,
    abs = Math.abs,
    max = Math.max,
    min = Math.min,
    sqrt = Math.sqrt,
    cellsLen = cells.length,
    cellTypePushModX = 1,
    cellTypePushModY = 1,
    centerCellPushFactor = 0,
    centerCellPushFactorX = 0,
    centerCellPushFactorY = 0,
    closestPointerPositionCenterCellNeighbor,
    closestPointerPositionCenterCellNeighborX,
    closestPointerPositionCenterCellNeighborY,
    closestPointerPositionCenterCellNeighborPushFactor = 1,
    closestPointerPositionCenterCellNeighborPushFactorX = 1,
    closestPointerPositionCenterCellNeighborPushFactorY = 1,
    addX = 0,
    addY = 0

  const mediaEnabled = globalConfig.media.enabled && pushRequestMediaVersions

  if (mediaEnabled) {
    const diagonal = dimensions.get('diagonal')
    mediaV1DistThreshold = diagonal * 0.075
    mediaV2DistThreshold = diagonal * 0.025
    mediaV1LevelAdjacencyThreshold = 18
    mediaV2LevelAdjacencyThreshold = 6
  }

  function applyLatticeLink(cell, target, alpha, size, strengthMod) {
    x = target.x + target.initialVx - cell.x - cell.initialVx
    y = target.y + target.initialVy - cell.y - cell.initialVy

    l = sqrt(x * x + y * y)
    l = ((l - size) / l) * alpha * latticeStrength * strengthMod * 0.5
    x *= l * latticeXFactor
    y *= l * latticeYFactor

    target.vx -= x
    target.vy -= y
    cell.vx += x
    cell.vy += y
  }

  // lattice loop must run separately, without interference from other forces
  function lattice(alpha) {
    minLatticeRow = max(centerCell.row - latticeMaxLevelsFromCenter, 1)
    maxLatticeRow = min(
      centerCell.row + latticeMaxLevelsFromCenter,
      globalConfig.lattice.rows,
    )
    minLatticeCol = max(centerCell.col - latticeMaxLevelsFromCenter, 1)
    maxLatticeCol = min(
      centerCell.col + latticeMaxLevelsFromCenter,
      globalConfig.lattice.cols,
    )

    // much faster than looping through all cells
    for (latticeCol = minLatticeCol; latticeCol < maxLatticeCol; latticeCol++) {
      for (
        latticeRow = minLatticeRow;
        latticeRow < maxLatticeRow;
        latticeRow++
      ) {
        i = latticeRow * globalConfig.lattice.cols + latticeCol
        if (i < cellsLen) {
          cell = cells[i]

          colLevelAdjacency = abs(cell.col - centerCell.col)
          rowLevelAdjacency = abs(cell.row - centerCell.row)
          maxLevelAdjacency = max(colLevelAdjacency, rowLevelAdjacency)
          latticeStrengthMod =
            (latticeMaxLevelsFromCenter - maxLevelAdjacency) /
            latticeMaxLevelsFromCenter

          // left
          applyLatticeLink(
            cell,
            cells[i - 1],
            alpha,
            latticeCellWidth,
            latticeStrengthMod,
          )

          // top
          applyLatticeLink(
            cell,
            cells[i - globalConfig.lattice.cols],
            alpha,
            latticeCellHeight,
            latticeStrengthMod,
          )
        }
      }
    }
  }

  function pushSetup(alpha) {
    if (mediaEnabled) {
      centerCell.targetMediaVersion = 2
    }

    centerCellX = centerCell.x + centerCell.vx
    centerCellY = centerCell.y + centerCell.vy
    // centerCell.weight = 1

    centerX = centerCellX
    centerY = centerCellY

    const hasPointer = isNumber(pointer?.x) && isNumber(pointer?.y)

    if (hasPointer) {
      centerX = pointer.x
      centerY = pointer.y

      // const closestCells = pointer.indices.filter((index) => isNumber(index) && index >= 0).map((i) => cells[i])
      // if (closestCells.length > 0) {
      //   calculatePointWeights(pointer, [closestCells[1],closestCells[2],closestCells[3]])
      //
      // }
      // closestCells[0].weight = 1
    }

    closestPointerPositionCenterCellNeighbor =
      cells[centerCell.closestIndices[0]]

    if (closestPointerPositionCenterCellNeighbor) {
      closestPointerPositionCenterCellNeighborX =
        closestPointerPositionCenterCellNeighbor.x +
        closestPointerPositionCenterCellNeighbor.vx
      closestPointerPositionCenterCellNeighborY =
        closestPointerPositionCenterCellNeighbor.y +
        closestPointerPositionCenterCellNeighbor.vy

      x = centerX - centerCellX
      y = centerY - centerCellY
      const centerToCenterCellDist = sqrt(x * x + y * y)

      x = centerX - closestPointerPositionCenterCellNeighborX
      y = centerY - closestPointerPositionCenterCellNeighborY
      const centerToCenterCellNeighborDist = sqrt(x * x + y * y)

      const distRatio = centerToCenterCellDist / centerToCenterCellNeighborDist

      const inverseDistRatio = 1 - distRatio

      // console.log('distRatio', distRatio)
      centerCellPushFactor = Math.min(distRatio, 1)
      centerCellPushFactorX = centerCellPushFactor
      centerCellPushFactorY = centerCellPushFactor
      // centerCellPushFactorX = centerCellPushFactor / pushXFactor
      // centerCellPushFactorY = centerCellPushFactor / pushYFactor

      closestPointerPositionCenterCellNeighborPushFactor =
        1 - centerCellPushFactor
      closestPointerPositionCenterCellNeighborPushFactorX =
        closestPointerPositionCenterCellNeighborPushFactor
      closestPointerPositionCenterCellNeighborPushFactorY =
        1 - centerCellPushFactor
    } else {
      centerCellPushFactor = 0
      closestPointerPositionCenterCellNeighborPushFactor = 1
    }
  }

  function force(alpha) {
    if (cells.focused?.index !== centerCell?.index) {
      previousCenterCell = centerCell
      centerCell = cells.focused
    }

    if (centerCell) {
      pushSetup(alpha)
      lattice(alpha)
    }

    for (i = 0; i < cells.length; ++i) {
      cell = cells[i]

      cell.vx += (cell.ix - cell.x) * originStrength * alpha * originXFactor
      cell.vy += (cell.iy - cell.y) * originStrength * alpha * originYFactor

      if (centerCell) {
        colLevelAdjacency = abs(cell.col - centerCell.col)
        rowLevelAdjacency = abs(cell.row - centerCell.row)
        maxLevelAdjacency = max(colLevelAdjacency, rowLevelAdjacency)

        x = cell.x + cell.vx - centerX
        y = cell.y + cell.vy - centerY
        l = sqrt(x * x + y * y)

        // media loading logic, might move it at some point
        if (
          l < mediaV2DistThreshold ||
          maxLevelAdjacency <= mediaV2LevelAdjacencyThreshold
        ) {
          // cell.targetMediaVersion = cell.mediaVersion === 0 ? 1 : 2
          cell.targetMediaVersion = 2
        } else if (
          l < mediaV1DistThreshold ||
          maxLevelAdjacency <= mediaV1LevelAdjacencyThreshold
        ) {
          cell.targetMediaVersion = max(cell.targetMediaVersion, 1)
        }

        if (l === 0) continue
        l = ((pushRadius - l) / l) * pushStrength

        x *= l
        y *= l

        cellTypePushModX = 1
        cellTypePushModY = 1

        if (i === centerCell.index) {
          cellTypePushModX = centerCellPushFactorX
          cellTypePushModY = centerCellPushFactorY
          // cellTypePushModX = 0
          // cellTypePushModY = 0
        }
        // if (i === closestPointerPositionCenterCellNeighbor?.index) {
        //   cellTypePushModX = closestPointerPositionCenterCellNeighborPushFactorX
        //   cellTypePushModY = closestPointerPositionCenterCellNeighborPushFactorY
        //
        //   // console.log('cellTypePushModY', cellTypePushModY)
        // }

        // if (cell.weight) {
        //   const w = 1 - cell.weight
        //   cellTypePushModX = w
        //   cellTypePushModY = w
        // }

        cell.vx += x * pushXFactor * cellTypePushModX
        cell.vy += y * pushYFactor * cellTypePushModY
      }

      handleEnd?.(cell)
    }
  }

  return force
}
