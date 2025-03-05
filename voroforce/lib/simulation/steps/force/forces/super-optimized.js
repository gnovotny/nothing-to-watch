import { isNumber, lerp } from '../../../../utils'

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
    cellIdentityPushMod = 1,
    centerCellPushFactor = 1

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

  function applyLatticeLink(cell, target, alpha, size, strengthMod) {
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
      if (mediaEnabled) {
        centerCell.targetMediaVersion = 2
      }

      centerCellX = centerCell.x + centerCell.vx
      centerCellY = centerCell.y + centerCell.vy

      targetCenterX = centerCellX
      targetCenterY = centerCellY

      const hasPointer = isNumber(pointer?.x) && isNumber(pointer?.y)

      if (hasPointer) {
        // targetCenterX = targetCenterX - (targetCenterX - pointer.x)
        // targetCenterY = targetCenterY - (targetCenterY - pointer.y)

        targetCenterX = pointer.x
        targetCenterY = pointer.y
      }

      centerX = centerX ?? targetCenterX
      centerY = centerY ?? targetCenterY
      centerX = lerp(
        centerX,
        targetCenterX,
        min(1, abs(targetCenterX - centerX) / 10),
      )

      centerY = lerp(
        centerY,
        targetCenterY,
        min(1, abs(targetCenterY - centerY) / 10),
      )

      const closestPointerPositionCenterCellNeighbor =
        cells[centerCell.closestIndices[0]]

      if (closestPointerPositionCenterCellNeighbor) {
        const closestPointerPositionCenterCellNeighborX =
          closestPointerPositionCenterCellNeighbor.x +
          closestPointerPositionCenterCellNeighbor.vx
        const closestPointerPositionCenterCellNeighborY =
          closestPointerPositionCenterCellNeighbor.y +
          closestPointerPositionCenterCellNeighbor.vy

        x = centerX - centerCellX
        y = centerY - centerCellY
        const distCenterToCenterCell = sqrt(x * x + y * y)

        x = centerX - closestPointerPositionCenterCellNeighborX
        y = centerY - closestPointerPositionCenterCellNeighborY
        const distCenterToCenterCellNeighbor = sqrt(x * x + y * y)

        const distRatio =
          distCenterToCenterCell / distCenterToCenterCellNeighbor

        // console.log(
        //   'distCenterToCenterCellNeighbor',
        //   distCenterToCenterCellNeighbor,
        // )
        // console.log('distCenterToCenterCell', distCenterToCenterCell)

        centerCellPushFactor = Math.min(distRatio, 1)
      } else {
        centerCellPushFactor = 0
      }
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
        latticeCol = minLatticeCol;
        latticeCol < maxLatticeCol;
        latticeCol++
      ) {
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

            applyLatticeLink(
              cell,
              cells[i - 1],
              alpha,
              latticeCellWidth,
              latticeStrengthMod,
            )
            applyLatticeLink(
              cell,
              cells[i - globalConfig.lattice.cols],
              alpha,
              latticeCellHeight,
              latticeStrengthMod,
            )
          }

          // i =
          //   (maxLatticeRow - (latticeRow - minLatticeRow)) *
          //     globalConfig.lattice.cols +
          //   (maxLatticeCol - (latticeCol - minLatticeCol))
          // if (i < cellsLen) {
          //   cell = cells[i]
          //
          //   colLevelAdjacency = abs(cell.col - centerCell.col)
          //   rowLevelAdjacency = abs(cell.row - centerCell.row)
          //   maxLevelAdjacency = max(colLevelAdjacency, rowLevelAdjacency)
          //   latticeStrengthMod =
          //     (latticeMaxLevelsFromCenter - maxLevelAdjacency) /
          //     latticeMaxLevelsFromCenter
          //
          //   applyLatticeComponent(
          //     cell,
          //     cells[i - 1],
          //     alpha,
          //     latticeCellWidth,
          //     latticeStrengthMod,
          //   )
          //   applyLatticeComponent(
          //     cell,
          //     cells[i - globalConfig.lattice.cols],
          //     alpha,
          //     latticeCellHeight,
          //     latticeStrengthMod,
          //   )
          // }
        }
      }
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

        const centerRow =
          pushCenterMagic &&
          cell.row === centerCell.row &&
          previousCenterCell?.row === centerCell.row

        const centerCol =
          pushCenterMagic &&
          cell.col === centerCell.col &&
          previousCenterCell?.col === centerCell.col

        const pushYMod = 1
        const pushXMod = 1

        // if (centerCol && rowLevelAdjacency < 20) {
        //   pushXMod = 1 - (20 - rowLevelAdjacency) / 20
        // }
        //
        // if (centerRow && colLevelAdjacency < 40) {
        //   pushYMod = 1 - (40 - colLevelAdjacency) / 40
        // }

        // if (centerRow && colLevelAdjacency > 1 && colLevelAdjacency < 20) {
        //   pushXMod += ((20 - colLevelAdjacency) / 20) * 0.3
        // }

        // if (colLevelAdjacency < 2 && rowLevelAdjacency < 2) {
        //   pushXMod *= 1.2
        //   pushYMod *= 1.2
        // }

        cellIdentityPushMod = 1
        if (i === centerCell.index) {
          cellIdentityPushMod = centerCellPushFactor
        }

        cell.vx += x * l * pushXFactor * pushXMod * cellIdentityPushMod
        cell.vy += y * l * pushYFactor * pushYMod * cellIdentityPushMod
      }

      handleEnd?.(cell)
    }
  }

  return force
}
