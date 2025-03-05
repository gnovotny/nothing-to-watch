import {} from '../../../../utils'

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
      manageMediaVersions: pushManageMediaVersions = true,
      skipYOnCenterCellRow: pushSkipYOnCenterCellRow = false,
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
    cellsLen = cells.length

  const mediaEnabled = globalConfig.media.enabled && pushManageMediaVersions

  if (mediaEnabled) {
    const diagonal = dimensions.get('diagonal')
    mediaV1DistThreshold = diagonal * 0.075
    mediaV2DistThreshold = diagonal * 0.025

    mediaV1LevelAdjacencyThreshold = 18
    mediaV2LevelAdjacencyThreshold = 6

    // console.log('mediaV1Threshold', mediaV1DistThreshold)
    // console.log('mediaV2Threshold', mediaV2DistThreshold)
  }

  function applyLatticeComponent(cell, target, alpha, size, strengthMod) {
    x = target.x + target.initialVx - cell.x - cell.initialVx
    y = target.y + target.initialVy - cell.y - cell.initialVy

    // x = target.x + target.vx - cell.x - cell.vx
    // y = target.y + target.vy - cell.y - cell.vy

    l = sqrt(x * x + y * y)
    l = ((l - size) / l) * alpha * latticeStrength * strengthMod * 0.5
    x *= l * latticeXFactor
    y *= l * latticeYFactor

    target.vx -= x
    target.vy -= y
    cell.vx += x
    cell.vy += y
  }

  function force(alpha) {
    if (cells.focused?.index !== centerCell?.index) {
      previousCenterCell = centerCell
      centerCell = cells.focused
    }

    if (centerCell) {
      centerCell.targetMediaVersion = 2
      centerX = centerCell.x + centerCell.vx
      centerY = centerCell.y + centerCell.vy
    }

    if (centerCell) {
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
      for (
        latticeRow = minLatticeRow;
        latticeRow < maxLatticeRow;
        latticeRow++
      ) {
        for (
          latticeCol = minLatticeCol;
          latticeCol < maxLatticeCol;
          latticeCol++
        ) {
          i = latticeRow * globalConfig.lattice.cols + latticeCol
          if (i >= cellsLen) break
          cell = cells[i]

          colLevelAdjacency = abs(cell.col - centerCell.col)
          rowLevelAdjacency = abs(cell.row - centerCell.row)
          maxLevelAdjacency = max(colLevelAdjacency, rowLevelAdjacency)
          latticeStrengthMod =
            (latticeMaxLevelsFromCenter - maxLevelAdjacency) /
            latticeMaxLevelsFromCenter

          applyLatticeComponent(
            cell,
            cells[i - 1],
            alpha,
            latticeCellWidth,
            latticeStrengthMod,
          )
          applyLatticeComponent(
            cell,
            cells[i - globalConfig.lattice.cols],
            alpha,
            latticeCellHeight,
            latticeStrengthMod,
          )
        }
      }
    }

    for (i = 0; i < cells.length; ++i) {
      cell = cells[i]

      cell.vx += (cell.ix - cell.x) * originStrength * alpha * originXFactor
      cell.vy += (cell.iy - cell.y) * originStrength * alpha * originYFactor

      if (centerCell) {
        if (i !== centerCell.index) {
          colLevelAdjacency = abs(cell.col - centerCell.col)
          rowLevelAdjacency = abs(cell.row - centerCell.row)
          maxLevelAdjacency = max(colLevelAdjacency, rowLevelAdjacency)

          x = cell.x + cell.vx - centerX
          y = cell.y + cell.vy - centerY
          l = sqrt(x * x + y * y)

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

          cell.vx += x * l * pushXFactor

          if (
            !pushSkipYOnCenterCellRow ||
            cell.row !== centerCell.row ||
            previousCenterCell?.row !== centerCell.row
          ) {
            cell.vy += y * l * pushYFactor
          }
        }
      }

      handleEnd?.(cell)
    }
  }

  return force
}
