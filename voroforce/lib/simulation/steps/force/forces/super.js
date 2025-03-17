import { clamp, lerp } from '../../../../utils'
import { diaphragmaticBreathing } from './utils/diaphragmatic-breathing'
import { easedMinLerp } from './utils/math'

export const superForce = ({
  cells,
  dimensions,
  pointer,
  config: {
    primarySelector = 'focused',
    requestMediaVersions = true,
    manageWeights = false,
    push: {
      strength: _pushStrength = 1,
      pushStrength = _pushStrength * 0.5,
      radius: pushRadius = dimensions.get('diagonal'),
      xFactor: configPushXMod = 1,
      yFactor: configPushYMod = 1,
      breathing: pushBreathing = false,
      alignmentMaxLevelsX: pushAlignmentMaxLevelsX = 0,
      alignmentMaxLevelsY: pushAlignmentMaxLevelsY = 0,
    } = {},
    lattice: {
      strength: latticeStrength = 0.8,
      xFactor: latticeXFactor = 1,
      yFactor: latticeYFactor = 1,
      maxLevelsFromPrimary: latticeMaxLevelsFromPrimary = 30,
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
  const primary = (cells) => cells[primarySelector]

  const abs = Math.abs,
    max = Math.max,
    min = Math.min,
    sqrt = Math.sqrt,
    cellsLen = cells.length,
    latticeCellWidth = globalConfig.lattice.cellWidth,
    latticeCellHeight = globalConfig.lattice.cellHeight,
    manageMedia = globalConfig.media?.enabled && requestMediaVersions

  let centerX,
    centerY,
    primaryCell,
    newPrimaryCell,
    prevPrimaryCell,
    primaryCellX,
    primaryCellY,
    cellTypePushXMod = 1,
    cellTypePushYMod = 1,
    primaryCellPushFactor = 0,
    primaryCellPushFactorX = 0,
    primaryCellPushFactorY = 0,
    secondaryCell,
    centerPullX = 0,
    centerPullY = 0,
    alignmentPushXMod = 1,
    alignmentPushYMod = 1,
    alignmentPushYModMod = 0,
    startTime,
    timestamp,
    breathingPushMod = 1,
    breathingCycleDuration = 6000,
    breathingPushVariability = 0.05,
    cell,
    i,
    x,
    y,
    l,
    mediaV1DistThreshold,
    mediaV2DistThreshold,
    mediaV1LevelAdjacencyThreshold,
    mediaV2LevelAdjacencyThreshold,
    colLevelAdjacency,
    rowLevelAdjacency,
    greatestDirLevelAdjacency,
    minLatticeRow,
    maxLatticeRow,
    minLatticeCol,
    maxLatticeCol,
    latticeRow,
    latticeCol,
    latticeStrengthMod

  if (manageMedia) {
    mediaV2DistThreshold = dimensions.get('diagonal') * 0.025
    mediaV1DistThreshold = mediaV2DistThreshold * 3
    mediaV2LevelAdjacencyThreshold = 6
    mediaV1LevelAdjacencyThreshold = mediaV2LevelAdjacencyThreshold * 3
  }

  function force(alpha) {
    forceSetup(alpha)
    if (primaryCell) latticeForcePass(alpha) // lattice pass must run in isolation
    mainForcePass(alpha)
  }

  function mainForcePass(alpha) {
    for (i = 0; i < cells.length; ++i) {
      cell = cells[i]

      // origin force
      cell.vx += (cell.ix - cell.x) * originStrength * alpha * originXFactor
      cell.vy += (cell.iy - cell.y) * originStrength * alpha * originYFactor

      if (primaryCell) {
        // center pull force
        cell.vx += centerPullX
        cell.vy += centerPullY

        colLevelAdjacency = abs(cell.col - primaryCell.col)
        rowLevelAdjacency = abs(cell.row - primaryCell.row)
        greatestDirLevelAdjacency = max(colLevelAdjacency, rowLevelAdjacency)

        x = cell.x + cell.vx - centerX
        y = cell.y + cell.vy - centerY
        l = sqrt(x * x + y * y)

        // media loading logic, might move it at some point
        if (manageMedia) {
          if (
            l < mediaV2DistThreshold ||
            greatestDirLevelAdjacency <= mediaV2LevelAdjacencyThreshold
          ) {
            // cell.targetMediaVersion = cell.mediaVersion === 0 ? 1 : 2
            cell.targetMediaVersion = max(cell.targetMediaVersion, 2)
          } else if (
            l < mediaV1DistThreshold ||
            greatestDirLevelAdjacency <= mediaV1LevelAdjacencyThreshold
          ) {
            cell.targetMediaVersion = max(cell.targetMediaVersion, 1)
          }
        }

        if (l === 0) continue
        l = ((pushRadius - l) / l) * pushStrength * alpha * breathingPushMod

        x *= l
        y *= l

        cellTypePushXMod = 1
        cellTypePushYMod = 1
        if (i === primaryCell.index) {
          cellTypePushXMod = primaryCellPushFactorX
          cellTypePushYMod = primaryCellPushFactorY
        }

        alignmentPushXMod = 1
        if (
          pushAlignmentMaxLevelsX > 0 &&
          secondaryCell &&
          prevPrimaryCell &&
          rowLevelAdjacency === 0 &&
          colLevelAdjacency < pushAlignmentMaxLevelsX
        ) {
          alignmentPushYMod =
            1 -
            ((pushAlignmentMaxLevelsX - max(colLevelAdjacency, 1)) /
              pushAlignmentMaxLevelsX) *
              alignmentPushYModMod
        }

        let eyeShapePushXMod = 1
        // const mod = 200
        // const maxColLevels = 4000
        const mod = 3
        const maxColLevels = 200
        const maxRowLevels = 6
        if (
          i !== primaryCell.index &&
          rowLevelAdjacency < maxRowLevels &&
          colLevelAdjacency < maxColLevels
        ) {
          eyeShapePushXMod =
            1 +
            mod *
              ((colLevelAdjacency + 1) / maxColLevels) *
              (1 - (rowLevelAdjacency + 1) / maxRowLevels)
        }

        // push force
        cell.vx +=
          x *
          configPushXMod *
          cellTypePushXMod *
          alignmentPushXMod *
          eyeShapePushXMod
        cell.vy += y * configPushYMod * cellTypePushYMod * alignmentPushYMod
      }

      // if (i === primaryCell?.index) {
      //   console.log('cell.weight', cell.weight)
      //   // cell.weight = easedMinLerp(cell.weight, 0, 0.075)
      // }

      if (manageWeights && cell.weight !== 0 && i !== primaryCell?.index) {
        cell.weight = easedMinLerp(cell.weight, 0, 0.3)
      }

      handleEnd?.(cell)
    }
  }

  function forceSetup(alpha) {
    timestamp = Date.now()
    if (!startTime) startTime = timestamp

    if (pushBreathing) {
      breathingPushMod =
        1 -
        breathingPushVariability +
        diaphragmaticBreathing(
          ((timestamp - startTime) % breathingCycleDuration) /
            breathingCycleDuration,
        ) *
          breathingPushVariability
    }

    newPrimaryCell = primary(cells)
    if (newPrimaryCell?.index !== primaryCell?.index) {
      prevPrimaryCell = primaryCell
      primaryCell = newPrimaryCell
    }

    if (!primaryCell) return

    if (manageMedia) {
      primaryCell.targetMediaVersion = 2
    }

    primaryCellX = primaryCell.x + primaryCell.vx
    primaryCellY = primaryCell.y + primaryCell.vy
    // primaryCell.weight = 1

    centerX = pointer?.x ?? primaryCellX
    centerY = pointer?.y ?? primaryCellY

    // const closestCells = pointer.indices.filter((index) => isNumber(index) && index >= 0).map((i) => cells[i])
    // if (closestCells.length > 0) {
    //   calculatePointWeights(pointer, [closestCells[1],closestCells[2],closestCells[3]])
    //
    // }
    // closestCells[0].weight = 1

    secondaryCell = cells[pointer.indices[1]]
    // cells[primaryCell.closestIndices[0]]

    // if (pointer.indices[0] !== primaryCell.index) {
    //   throw new Error('asdf')
    // }

    if (secondaryCell) {
      x = centerX - primaryCellX
      y = centerY - primaryCellY
      const centerToPrimaryCellDist = sqrt(x * x + y * y)

      x = centerX - (secondaryCell.x + secondaryCell.vx)
      y = centerY - (secondaryCell.y + secondaryCell.vy)
      const centerToPrimaryCellNeighborDist = sqrt(x * x + y * y)

      const distRatio =
        centerToPrimaryCellDist / centerToPrimaryCellNeighborDist

      const inverseDistRatio = 1 - distRatio
      const clampedSquareRootInverseDistRatio = clamp(
        0,
        1,
        inverseDistRatio ** 2,
      )

      // console.log(
      //   'clampedSquaredInverseDistRatio',
      //   clampedSquareRootInverseDistRatio,
      // )

      const newWeight =
        clampedSquareRootInverseDistRatio * breathingPushMod ** 2
      primaryCell.weight = easedMinLerp(
        primaryCell.weight,
        newWeight,
        newWeight > primaryCell.weight ? 0.025 : 0.075,
      )

      if (distRatio > 1) {
        // console.log('distRatio', distRatio)
        // throw new Error('asdf')
      }
      primaryCellPushFactor = Math.min(distRatio, 1)
      primaryCellPushFactorX = primaryCellPushFactor
      primaryCellPushFactorY = primaryCellPushFactor

      centerPullX = clamp(
        -1,
        1,
        lerp(
          centerPullX,
          (centerX - primaryCellX) * inverseDistRatio,
          min(1, abs(centerX - primaryCellX) * 0.0001),
        ),
      )

      centerPullY = clamp(
        -1,
        1,
        lerp(
          centerPullY,
          (centerY - primaryCellY) * inverseDistRatio,
          min(1, abs(centerY - primaryCellY) * 0.0001),
        ),
      )

      primaryCell.x += centerPullX
      primaryCell.y += centerPullY
      primaryCellX = primaryCell.x + primaryCell.vx
      primaryCellY = primaryCell.y + primaryCell.vy
    } else {
      primaryCellPushFactor = 0
    }

    if (
      primaryCell.row === secondaryCell?.row &&
      primaryCell.row === prevPrimaryCell?.row
    ) {
      alignmentPushYModMod = lerp(alignmentPushYModMod, 1, 0.025)
    } else {
      alignmentPushYModMod = 0
    }
  }

  function latticeForcePass(alpha) {
    minLatticeRow = max(primaryCell.row - latticeMaxLevelsFromPrimary, 1)
    maxLatticeRow = min(
      primaryCell.row + latticeMaxLevelsFromPrimary,
      globalConfig.lattice.rows,
    )
    minLatticeCol = max(primaryCell.col - latticeMaxLevelsFromPrimary, 1)
    maxLatticeCol = min(
      primaryCell.col + latticeMaxLevelsFromPrimary,
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

          colLevelAdjacency = abs(cell.col - primaryCell.col)
          rowLevelAdjacency = abs(cell.row - primaryCell.row)
          greatestDirLevelAdjacency = max(colLevelAdjacency, rowLevelAdjacency)
          latticeStrengthMod =
            (latticeMaxLevelsFromPrimary - greatestDirLevelAdjacency) /
            latticeMaxLevelsFromPrimary

          // left
          latticeLinkForce(
            cell,
            cells[i - 1],
            alpha,
            latticeCellWidth,
            latticeStrengthMod,
          )

          // top
          latticeLinkForce(
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

  function latticeLinkForce(cell, target, alpha, size, strengthMod) {
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

  return force
}
