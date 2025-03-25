import { clamp, easedMinLerp, lerp, mapRange } from '../../../../utils'
import { diaphragmaticBreathing } from './utils/diaphragmatic-breathing'

const LERP_FACTOR_DEFAULT = 0.025

const abs = Math.abs,
  max = Math.max,
  min = Math.min,
  sqrt = Math.sqrt

const getPushRadius = (dimensions) => {
  // const dimensionsScale = 0.5
  const dimensionsScale = 1
  const aspect = dimensions.get('aspect')
  const relativeAspect = aspect >= 1 ? aspect : 1 / aspect
  const minScale = Math.min(Math.max(relativeAspect * 0.75, 1), 2.5)
  let min = dimensions.get('width') * dimensionsScale
  let max = dimensions.get('height') * dimensionsScale
  if (min > max) [min, max] = [max, min]
  return Math.min(max, min * minScale)
}

export const omniForce = ({
  cells,
  dimensions,
  pointer,
  globalConfig,
  config: {
    cellsLen = cells.length,
    primarySelector = 'focused',
    requestMediaVersions: _requestMediaVersions = true,
    requestMediaVersions = globalConfig.media?.enabled && _requestMediaVersions,
    mediaV2ColLevelAdjacencyThreshold = 6,
    mediaV2RowLevelAdjacencyThreshold = 3,
    mediaV1ColLevelAdjacencyThreshold = mediaV2ColLevelAdjacencyThreshold * 4,
    mediaV1RowLevelAdjacencyThreshold = mediaV2RowLevelAdjacencyThreshold * 4,
    mediaV1SpeedLimit = 0.75,
    mediaV2SpeedLimit = 0.25,
    manageWeights = false,
    lerpCenterToPrimaryCellOnIdlePointer = true,
    idlePointerDelay = 500,
    defaultLerpFactor = LERP_FACTOR_DEFAULT,
    push: {
      strength: _pushStrength = 1,
      // pushStrength = _pushStrength,
      pushStrength = _pushStrength * 0.5,
      radius: pushRadius = getPushRadius(dimensions),
      xFactor: configPushXMod = 1,
      yFactor: configPushYMod = 1,
      speedFactor: configPushSpeedFactor = 0,
      breathing: pushBreathing = false,
      breathingCycleDuration: pushBreathingCycleDuration = 6000,
      breathingVariability: pushBreathingVariability = 0.05,
      alignmentMaxLevelsX: pushAlignmentMaxLevelsX = 0,
      alignmentMaxLevelsY: pushAlignmentMaxLevelsY = 0,
      centerXStretchMod: pushCenterXStretchMod = 0,
      // centerXStretchMaxLevelsX: pushCenterXStretchMaxLevelsX = globalConfig
      //   .lattice.cols * 0.4,
      // centerXStretchMaxLevelsY: pushCenterXStretchMaxLevelsY = 12,
      centerXStretchMaxLevelsX: pushCenterXStretchMaxLevelsX = globalConfig
        .lattice.cols /* * 0.25*/,
      centerXStretchMaxLevelsY: pushCenterXStretchMaxLevelsY = globalConfig
        .lattice.rows /* * 0.25*/,
    } = {},
    lattice: {
      strength: latticeStrength = 0.8,
      xFactor: latticeXFactor = 1,
      yFactor: latticeYFactor = 1,
      maxLevelsFromPrimary: latticeMaxLevelsFromPrimary = 30,
      cellWidth: latticeCellWidth = globalConfig.lattice.cellWidth,
      cellHeight: latticeCellHeight = globalConfig.lattice.cellHeight,
    } = {},
    origin: {
      strength: originStrength = 0.8,
      xFactor: originXFactor = 1,
      yFactor: originYFactor = 1,
    } = {},
  } = {},
  handleEnd,
}) => {
  const selectPrimary = (cells) => cells[primarySelector]

  let centerX,
    centerY,
    targetCenterX,
    targetCenterY,
    primaryCell,
    newPrimaryCell,
    prevPrimaryCell,
    primaryCellX,
    primaryCellY,
    cellTypePushXMod = 1,
    cellTypePushYMod = 1,
    primaryCellPushFactorX = 0,
    primaryCellPushFactorY = 0,
    secondaryCell,
    centerToPrimaryCellDist,
    centerToSecondaryCellDist,
    distRatio,
    centerPullX = 0,
    centerPullY = 0,
    alignmentPushXMod = 1,
    alignmentPushYMod = 1,
    alignmentPushYModMod = 0,
    startTime,
    timestamp,
    breathingPushMod = 1,
    cell,
    i,
    x,
    y,
    l,
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
    isPrimaryCell = false,
    pointerSpeedScale = 0,
    inversePointerSpeedScale = 1,
    idlePointerTimeout,
    idleLerpCenterToPrimaryCell = false,
    primaryCellWeight = 0,
    primaryCellWeightPushFactor = 1,
    pushSpeedFactor = 1

  // TODO
  // if (manageMedia) {
  // const mediaV2DistThreshold = pushRadius * 0.1
  // const mediaV1DistThreshold = mediaV2DistThreshold * 3
  // }

  function force(alpha) {
    forceSetup(alpha)
    latticeForcePass(alpha) // lattice pass must run in isolation
    mainForcePass(alpha)
  }

  function forceSetup(alpha) {
    newPrimaryCell = selectPrimary(cells)
    if (newPrimaryCell?.index !== primaryCell?.index) {
      prevPrimaryCell = primaryCell
      primaryCell = newPrimaryCell
    }

    if (!primaryCell) return

    pointerSpeedScale = pointer.speedScale
    inversePointerSpeedScale = 1 - pointerSpeedScale

    if (pushBreathing) {
      timestamp = Date.now()
      if (!startTime) startTime = timestamp
      breathingPushMod =
        1 -
        pushBreathingVariability +
        diaphragmaticBreathing(
          ((timestamp - startTime) % pushBreathingCycleDuration) /
            pushBreathingCycleDuration,
        ) *
          pushBreathingVariability *
          inversePointerSpeedScale
    }

    if (requestMediaVersions) {
      if (pointerSpeedScale < mediaV2SpeedLimit) {
        primaryCell.targetMediaVersion = max(primaryCell.targetMediaVersion, 2)
      }
    }

    if (configPushSpeedFactor > 0) {
      pushSpeedFactor = easedMinLerp(
        pushSpeedFactor,
        max(inversePointerSpeedScale, 0.2),
        defaultLerpFactor,
      )
      // console.log(pushSpeedFactor, 'pushSpeedFactor')
    }

    // console.log('inversePointerSpeedScale', inversePointerSpeedScale)

    primaryCellX = primaryCell.x + primaryCell.vx
    primaryCellY = primaryCell.y + primaryCell.vy
    targetCenterX = pointer?.x ?? primaryCellX
    targetCenterY = pointer?.y ?? primaryCellY
    centerX = centerX ?? targetCenterX
    centerY = centerY ?? targetCenterY

    if (lerpCenterToPrimaryCellOnIdlePointer && pointerSpeedScale === 0) {
      if (idlePointerDelay > 0 && !idlePointerTimeout) {
        idlePointerTimeout = setTimeout(() => {
          idleLerpCenterToPrimaryCell = true
        }, idlePointerDelay)
      } else {
        idleLerpCenterToPrimaryCell = true
      }

      if (idleLerpCenterToPrimaryCell) {
        // if (pointerSpeedScale < 0.05) {
        centerX = easedMinLerp(
          centerX,
          primaryCellX,
          defaultLerpFactor /* * ((0.05 - pointerSpeedScale) / 0.05)*/,
        )
        centerY = easedMinLerp(
          centerY,
          primaryCellY,
          defaultLerpFactor /* * ((0.05 - pointerSpeedScale) / 0.05)*/,
        )
      }
    } else {
      if (lerpCenterToPrimaryCellOnIdlePointer) {
        if (idlePointerTimeout) {
          clearTimeout(idlePointerTimeout)
          idlePointerTimeout = undefined
        }
        idleLerpCenterToPrimaryCell = false
      }
      centerX = easedMinLerp(centerX, targetCenterX, defaultLerpFactor)
      centerY = easedMinLerp(centerY, targetCenterY, defaultLerpFactor)
    }

    secondaryCell = cells[pointer.indices[1]]

    if (secondaryCell) {
      x = centerX - primaryCellX
      y = centerY - primaryCellY
      centerToPrimaryCellDist = sqrt(x * x + y * y)
      x = centerX - (secondaryCell.x + secondaryCell.vx)
      y = centerY - (secondaryCell.y + secondaryCell.vy)
      centerToSecondaryCellDist = sqrt(x * x + y * y)
      distRatio = centerToPrimaryCellDist / centerToSecondaryCellDist

      primaryCellPushFactorX = primaryCellPushFactorY = Math.min(distRatio, 1)

      if (manageWeights) {
        distRatio = clamp(0, 1, (1 - distRatio) ** 2)
        primaryCellWeight =
          distRatio *
          // breathingPushMod ** 2 *
          breathingPushMod *
          inversePointerSpeedScale *
          pushSpeedFactor
        primaryCellWeight = primaryCell.weight = easedMinLerp(
          primaryCell.weight,
          primaryCellWeight,
          primaryCellWeight > primaryCell.weight
            ? defaultLerpFactor * sqrt(inversePointerSpeedScale)
            : defaultLerpFactor * 3,
        )

        // primaryCellWeightPushFactor =
        //   1 + clamp(0, 0.125, mapRange(0.25, 1, 0, 0.25, primaryCellWeight))

        primaryCellWeightPushFactor = easedMinLerp(
          primaryCellWeightPushFactor,
          1 + clamp(0, 0.125, mapRange(0.25, 1, 0, 0.25, primaryCellWeight)),
          defaultLerpFactor,
        )

        // console.log(primaryCellWeightPushFactor)
      }
    }

    if (
      primaryCell.row === secondaryCell?.row &&
      primaryCell.row === prevPrimaryCell?.row
    ) {
      alignmentPushYModMod = lerp(alignmentPushYModMod, 1, defaultLerpFactor)
    } else {
      alignmentPushYModMod = 0
    }
  }

  function mainForcePass(alpha) {
    for (i = 0; i < cellsLen; ++i) {
      cell = cells[i]

      // origin force
      cell.vx += (cell.ix - cell.x) * originStrength * alpha * originXFactor
      cell.vy += (cell.iy - cell.y) * originStrength * alpha * originYFactor

      if (primaryCell) {
        isPrimaryCell = i === primaryCell.index

        colLevelAdjacency = abs(cell.col - primaryCell.col)
        rowLevelAdjacency = abs(cell.row - primaryCell.row)
        greatestDirLevelAdjacency = max(colLevelAdjacency, rowLevelAdjacency)

        x = cell.x + cell.vx - centerX
        y = cell.y + cell.vy - centerY
        l = x * x + y * y

        if (l !== 0 && l < pushRadius * pushRadius) {
          l = sqrt(l)
          // media loading logic, might move it at some point
          if (requestMediaVersions) {
            if (
              pointerSpeedScale < mediaV2SpeedLimit &&
              // l < mediaV2DistThreshold ||
              colLevelAdjacency <= mediaV2ColLevelAdjacencyThreshold &&
              rowLevelAdjacency <= mediaV2RowLevelAdjacencyThreshold
            ) {
              cell.targetMediaVersion = max(cell.targetMediaVersion, 2)
            } else if (
              pointerSpeedScale < mediaV1SpeedLimit &&
              // l < mediaV1DistThreshold ||
              colLevelAdjacency <= mediaV1ColLevelAdjacencyThreshold &&
              rowLevelAdjacency <= mediaV1RowLevelAdjacencyThreshold
            ) {
              cell.targetMediaVersion = max(cell.targetMediaVersion, 1)
              // cell.targetMediaVersion = 1 // reduce res if out of range (mipmapping)
            } else {
              cell.targetMediaVersion = min(cell.targetMediaVersion, 1) // reduce res if out of range (mipmapping)
            }
          }

          l = (pushRadius - l) / l

          l *=
            pushStrength *
            alpha *
            breathingPushMod *
            pushSpeedFactor *
            primaryCellWeightPushFactor

          // center pull force
          // cell.vx += centerPullX * l * configPushXMod * alpha
          // cell.vy += centerPullY * l * configPushYMod * alpha

          x *= l
          y *= l

          cellTypePushXMod = 1
          cellTypePushYMod = 1
          centerXStretchMod = 1
          if (isPrimaryCell) {
            cellTypePushXMod = primaryCellPushFactorX
            cellTypePushYMod = primaryCellPushFactorY
          } else {
            if (
              pushCenterXStretchMod > 0 &&
              rowLevelAdjacency < pushCenterXStretchMaxLevelsY &&
              colLevelAdjacency > 0 &&
              colLevelAdjacency < pushCenterXStretchMaxLevelsX
            ) {
              // centerXStretchMod +=
              //   pushCenterXStretchMod *
              //   ((colLevelAdjacency / pushCenterXStretchMaxLevelsX) *
              //     (1 - rowLevelAdjacency / pushCenterXStretchMaxLevelsY))
              centerXStretchMod +=
                pushCenterXStretchMod *
                ((colLevelAdjacency / pushCenterXStretchMaxLevelsX) *
                  (1 - rowLevelAdjacency / pushCenterXStretchMaxLevelsY)) *
                abs(x)
              //  *(1 / max(abs(x), 1)) *
              //   *(1 / max(abs(y), 1))
            }

            // if (pushCenterXStretchMod > 0) {
            //   centerXStretchMod += clamp(
            //     0,
            //     100,
            //     clamp(0, 0.005, abs((pushRadius - abs(x)) / abs(x))) *
            //       pushCenterXStretchMod,
            //   )
            // }
          }

          alignmentPushYMod = 1
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
        cell.weight = easedMinLerp(cell.weight, 0, defaultLerpFactor * 4)
      }

      handleEnd?.(cell)
    }
  }

  function latticeForcePass(alpha) {
    if (!primaryCell) return

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
