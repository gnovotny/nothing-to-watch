import { clamp, easedMinLerp, lerp } from '../../../../utils'
import { diaphragmaticBreathing } from './utils/diaphragmatic-breathing'

const getPushRadius = (dimensions) => {
  // const dimensionsScale = 0.125
  const dimensionsScale = 0.5
  const aspect = dimensions.get('aspect')
  const relativeAspect = aspect >= 1 ? aspect : 1 / aspect
  const minScale = Math.min(Math.max(relativeAspect * 0.75, 1), 2.5)
  let min = dimensions.get('width') * dimensionsScale
  let max = dimensions.get('height') * dimensionsScale
  if (min > max) [min, max] = [max, min]
  return Math.min(max, min * minScale)
}

export const tntwOmniForce = ({
  cells,
  dimensions,
  pointer,
  globalConfig,
  config: {
    primarySelector = 'focused',
    requestMediaVersions = true,
    manageWeights = false,
    push: {
      strength: _pushStrength = 1,
      pushStrength = _pushStrength,
      radius: pushRadius = getPushRadius(dimensions),
      xFactor: configPushXMod = 1,
      yFactor: configPushYMod = 1,
      breathing: pushBreathing = false,
      alignmentMaxLevelsX: pushAlignmentMaxLevelsX = 0,
      alignmentMaxLevelsY: pushAlignmentMaxLevelsY = 0,
      centerXStretchMod: pushCenterXStretchMod = 0,
      centerXStretchMaxLevelsX: pushCenterXStretchMaxLevelsX = globalConfig
        .lattice.cols * 0.4,
      centerXStretchMaxLevelsY: pushCenterXStretchMaxLevelsY = 12,
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
    mediaV1ColLevelAdjacencyThreshold,
    mediaV1RowLevelAdjacencyThreshold,
    mediaV2ColLevelAdjacencyThreshold,
    mediaV2RowLevelAdjacencyThreshold,
    colLevelAdjacency,
    rowLevelAdjacency,
    greatestDirLevelAdjacency,
    minLatticeRow,
    maxLatticeRow,
    minLatticeCol,
    maxLatticeCol,
    latticeRow,
    latticeCol,
    latticeStrengthMod,
    centerXStretchMod,
    centerXStretchModColRatio,
    isPrimaryCell = false

  if (manageMedia) {
    // mediaV2DistThreshold = pushRadius * 0.1 // TODO
    // mediaV1DistThreshold = mediaV2DistThreshold * 3 // TODO
    mediaV2DistThreshold = 0
    mediaV1DistThreshold = 0
    mediaV2ColLevelAdjacencyThreshold = 9
    mediaV2RowLevelAdjacencyThreshold = 3
    mediaV1ColLevelAdjacencyThreshold = mediaV2ColLevelAdjacencyThreshold * 3
    mediaV1RowLevelAdjacencyThreshold = mediaV2RowLevelAdjacencyThreshold * 3
  }

  function force(alpha) {
    forceSetup(alpha)
    if (primaryCell) latticeForcePass(alpha) // lattice pass must run in isolation
    mainForcePass(alpha)
  }

  function mainForcePass(alpha) {
    for (i = 0; i < cellsLen; ++i) {
      cell = cells[i]

      // origin force
      cell.vx += (cell.ix - cell.x) * originStrength * alpha * originXFactor
      cell.vy += (cell.iy - cell.y) * originStrength * alpha * originYFactor

      if (primaryCell) {
        isPrimaryCell = i === primaryCell.index
        // center pull force
        cell.vx += centerPullX * (isPrimaryCell ? 1 : 1)
        cell.vy += centerPullY * (isPrimaryCell ? 1 : 1)

        colLevelAdjacency = abs(cell.col - primaryCell.col)
        rowLevelAdjacency = abs(cell.row - primaryCell.row)
        greatestDirLevelAdjacency = max(colLevelAdjacency, rowLevelAdjacency)

        x = cell.x + cell.vx - centerX
        y = cell.y + cell.vy - centerY
        l = sqrt(x * x + y * y)

        if (l !== 0 && l <= pushRadius) {
          // media loading logic, might move it at some point
          if (manageMedia) {
            if (
              l < mediaV2DistThreshold ||
              (colLevelAdjacency <= mediaV2ColLevelAdjacencyThreshold &&
                rowLevelAdjacency <= mediaV2RowLevelAdjacencyThreshold)
            ) {
              // cell.targetMediaVersion = cell.mediaVersion === 0 ? 1 : 2
              cell.targetMediaVersion = max(cell.targetMediaVersion, 2)
            } else if (
              l < mediaV1DistThreshold ||
              (colLevelAdjacency <= mediaV1ColLevelAdjacencyThreshold &&
                rowLevelAdjacency <= mediaV1RowLevelAdjacencyThreshold)
            ) {
              cell.targetMediaVersion = max(cell.targetMediaVersion, 1)
            }
          }

          l = ((pushRadius - l) / l) * pushStrength * alpha * breathingPushMod

          x *= l
          y *= l

          cellTypePushXMod = 1
          cellTypePushYMod = 1
          if (isPrimaryCell) {
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

          centerXStretchMod = 1
          if (
            pushCenterXStretchMod > 0 &&
            rowLevelAdjacency <= pushCenterXStretchMaxLevelsY &&
            colLevelAdjacency <= pushCenterXStretchMaxLevelsX &&
            !isPrimaryCell
          ) {
            centerXStretchModColRatio =
              colLevelAdjacency / pushCenterXStretchMaxLevelsX
            centerXStretchMod =
              1 +
              pushCenterXStretchMod *
                ((centerXStretchModColRatio > 0.5
                  ? 1 - centerXStretchModColRatio
                  : centerXStretchModColRatio) *
                  (1 - rowLevelAdjacency / pushCenterXStretchMaxLevelsY))
          }

          // push force
          cell.vx +=
            x *
            configPushXMod *
            cellTypePushXMod *
            alignmentPushXMod *
            centerXStretchMod
          cell.vy += y * configPushYMod * cellTypePushYMod * alignmentPushYMod
        }
      }

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

    centerX = pointer?.x ?? primaryCellX
    centerY = pointer?.y ?? primaryCellY

    // console.log('pointer speed', pointer.speedScale)

    secondaryCell = cells[pointer.indices[1]]

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

      const newWeight =
        clampedSquareRootInverseDistRatio * breathingPushMod ** 2
      // const newWeight = clamp(0, 1, inverseDistRatio)
      primaryCell.weight = easedMinLerp(
        primaryCell.weight,
        newWeight,
        newWeight > primaryCell.weight ? 0.025 : 0.075,
      )

      // if (distRatio > 1) throw new Error('how?')

      primaryCellPushFactor = Math.min(distRatio, 1)
      primaryCellPushFactorX = primaryCellPushFactor
      primaryCellPushFactorY = primaryCellPushFactor

      centerPullX = clamp(
        -1,
        1,
        lerp(
          centerPullX,
          (centerX - primaryCellX) * clampedSquareRootInverseDistRatio,
          min(1, abs(centerX - primaryCellX) * 0.0001),
        ),
      )

      centerPullY = clamp(
        -1,
        1,
        lerp(
          centerPullY,
          (centerY - primaryCellY) * clampedSquareRootInverseDistRatio,
          min(1, abs(centerY - primaryCellY) * 0.0001),
        ),
      )

      // primaryCell.x += centerPullX
      // primaryCell.y += centerPullY
      // primaryCellX = primaryCell.x + primaryCell.vx
      // primaryCellY = primaryCell.y + primaryCell.vy
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
