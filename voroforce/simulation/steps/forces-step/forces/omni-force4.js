// @ts-nocheck
// ^ the huge destructuring of function args causes tsc to hang
import {
  clamp,
  easedMinLerp,
  lerp,
  mapRange,
  MIN_LERP_EASING_TYPES,
} from '../../../../utils'
import { diaphragmaticBreathing } from './utils/diaphragmatic-breathing'

const LERP_FACTOR_DEFAULT = 0.025

const { abs, max, min, sqrt, pow } = Math

const dist = (x1, y1, x2, y2) => sqrt(pow(x2 - x1, 2) + pow(y2 - y1, 2))
const dist2d = (a, b) => sqrt(pow(b.x - a.x, 2) + pow(b.y - a.y, 2))

const getPushRadius = (dimensions) => {
  return dimensions.get('diagonal')

  // // const dimensionsScale = 0.5
  // const dimensionsScale = 1
  // const aspect = dimensions.get('aspect')
  // const relativeAspect = aspect >= 1 ? aspect : 1 / aspect
  // const minScale = min(max(relativeAspect * 0.75, 1), 2.5)
  // let min = dimensions.get('width') * dimensionsScale
  // let max = dimensions.get('height') * dimensionsScale
  // if (min > max) [min, max] = [max, min]
  // return min(max, min * minScale)
}

export const omniForce = ({
  cells,
  dimensions,
  pointer,
  sharedData,
  globalConfig,
  config: {
    cellsLen = cells.length,
    primarySelector = 'focused',
    defaultLerpFactor = LERP_FACTOR_DEFAULT,
    manageWeights = false,
    smoothPrimaryCell = false,
    breathing: {
      enabled: breathing = false,
      cycleDuration: breathingCycleDuration = 6000,
      variability: breathingVariability = 0.1,
    } = {},
    requestMediaVersions: {
      enabled: _requestMediaVersions = true,
      requestMediaVersions = globalConfig.media?.enabled &&
        _requestMediaVersions,
      versionCount: mediaVersionCount = globalConfig.media?.versions?.length ??
        0,
      v3ColLevelAdjacencyThreshold: mediaV3ColLevelAdjacencyThreshold = 0,
      v3RowLevelAdjacencyThreshold: mediaV3RowLevelAdjacencyThreshold = 0,
      v2ColLevelAdjacencyThreshold: mediaV2ColLevelAdjacencyThreshold = 6,
      v2RowLevelAdjacencyThreshold: mediaV2RowLevelAdjacencyThreshold = 3,
      v1ColLevelAdjacencyThreshold:
        mediaV1ColLevelAdjacencyThreshold = mediaV2ColLevelAdjacencyThreshold *
        4,
      v1RowLevelAdjacencyThreshold:
        mediaV1RowLevelAdjacencyThreshold = mediaV2RowLevelAdjacencyThreshold *
        4,
      v1SpeedLimit: mediaV1SpeedLimit = 0.5,
      v2SpeedLimit: mediaV2SpeedLimit = 0.25,
      v3SpeedLimit: mediaV3SpeedLimit = 0.25,
      versions: mediaVersions = [
        ...(mediaVersionCount > 3 &&
        mediaV3ColLevelAdjacencyThreshold > 0 &&
        mediaV3RowLevelAdjacencyThreshold > 0
          ? [
              {
                index: 3,
                adjacencyThreshold: {
                  col: mediaV3ColLevelAdjacencyThreshold,
                  row: mediaV3RowLevelAdjacencyThreshold,
                },
                speedLimit: mediaV3SpeedLimit,
              },
            ]
          : []),
        {
          index: 2,
          adjacencyThreshold: {
            col: mediaV2ColLevelAdjacencyThreshold,
            row: mediaV2RowLevelAdjacencyThreshold,
          },
          speedLimit: mediaV2SpeedLimit,
        },
        {
          index: 1,
          adjacencyThreshold: {
            col: mediaV1ColLevelAdjacencyThreshold,
            row: mediaV1RowLevelAdjacencyThreshold,
          },
          speedLimit: mediaV1SpeedLimit,
        },
      ],
      validVersions: validMediaVersions = mediaVersions.filter(
        (v) => v.adjacencyThreshold.col > 0 && v.adjacencyThreshold.row > 0,
      ),
      version: mediaVersion = mediaVersions[0],
      maxTargetVersion: maxTargetMediaVersion = mediaVersionCount - 1,
      highestSpeedLimit: mediaHighestSpeedLimit = validMediaVersions[
        validMediaVersions.length - 1
      ].speedLimit,
      vMaxSpeedLimit: mediaVMaxSpeedLimit = maxTargetMediaVersion === 3
        ? mediaV3SpeedLimit
        : mediaV2SpeedLimit,
      handleCellMediaVersions = (
        cell,
        speedScale,
        colLevelAdjacency,
        rowLevelAdjacency,
      ) => {
        if (speedScale > mediaHighestSpeedLimit) return
        /** dynamic but possibly less performant fn **/
        for (let i = 0; i < validMediaVersions.length; ++i) {
          mediaVersion = validMediaVersions[i]

          if (
            speedScale < mediaVersion.speedLimit &&
            colLevelAdjacency <= mediaVersion.adjacencyThreshold.col &&
            rowLevelAdjacency <= mediaVersion.adjacencyThreshold.row
          ) {
            cell.targetMediaVersion = max(
              cell.targetMediaVersion,
              mediaVersion.index,
            )
            return
          }
        }

        cell.targetMediaVersion = min(cell.targetMediaVersion, 1) // reduce res if out of range (free mipmapping)

        /** old hardcoded fn **/
        // if (
        //   speedScale < mediaV2SpeedLimit &&
        //   colLevelAdjacency <= mediaV2ColLevelAdjacencyThreshold &&
        //   rowLevelAdjacency <= mediaV2RowLevelAdjacencyThreshold
        // ) {
        //   cell.targetMediaVersion = max(cell.targetMediaVersion, 2)
        // } else if (
        //   speedScale < mediaV1SpeedLimit &&
        //   colLevelAdjacency <= mediaV1ColLevelAdjacencyThreshold &&
        //   rowLevelAdjacency <= mediaV1RowLevelAdjacencyThreshold
        // ) {
        //   cell.targetMediaVersion = max(cell.targetMediaVersion, 1)
        //   // cell.targetMediaVersion = 1 // reduce res if out of range (free mipmapping)
        // } else {
        //   if (speedScale < mediaV1SpeedLimit) {
        //     cell.targetMediaVersion = min(cell.targetMediaVersion, 1) // reduce res if out of range (free mipmapping)
        //   }
        // }
      },
    } = {},
    push: {
      strength: _pushStrength = 1,
      // pushStrength = _pushStrength,
      pushStrength = _pushStrength * 0.5,
      radius: pushRadius = getPushRadius(dimensions),
      radiusLimit: pushRadiusLimit = true,
      xFactor: configPushXMod = 1,
      yFactor: configPushYMod = 1,
      speedFactor: configPushSpeedFactor = 0,
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
      cellSizeMod: latticeCellSizeMod = 1,
      cellWidthMod: latticeCellWidthMod = latticeCellSizeMod,
      cellHeightMod: latticeCellHeightMod = latticeCellSizeMod,
      cols: latticeCols = globalConfig.lattice.cols,
      rows: latticeRows = globalConfig.lattice.rows,
    } = {},
    origin: {
      strength: originStrength = 0.8,
      xFactor: originXFactor = 1,
      yFactor: originYFactor = 1,
      latticeScale: originLatticeScale = 1,
      originX: originLatticeX = globalConfig.lattice.latticeWidth / 2,
      originY: originLatticeY = globalConfig.lattice.latticeHeight / 2,
    } = {},
  } = {},
  handleEnd,
}) => {
  const selectPrimary = (cells) => cells[primarySelector]

  let pointerX,
    pointerY,
    pointerSpeedScale = 0,
    complementPointerSpeedScale = 1,
    verySlowPointerMod = 0,
    nextVerySlowPointerMod = 0,
    lastVerySlowPointerMod = 0,
    slowPointerMod = 0,
    easedIdlePointerMod = 1,
    easedActivePointerMod = 0,
    prevCenterX,
    prevCenterY,
    centerX,
    centerY,
    targetCenterX,
    targetCenterY,
    latticeCenterX = originLatticeX,
    latticeCenterY = originLatticeY,
    centerLerp = defaultLerpFactor,
    primaryCell,
    primaryCellIndex,
    primaryCellCol,
    primaryCellRow,
    nextPrimaryCell,
    nextPrimaryCellIndex,
    prevPrimaryCell,
    slowIdlePrimaryCellMod = 1,
    idlePrimaryCellMod = 1,
    primaryCellX,
    primaryCellY,
    prevPrimaryCellX,
    prevPrimaryCellY,
    secondaryCell,
    secondaryCellX,
    secondaryCellY,
    basePushDistMod = 1,
    commonPushDistMod = 1,
    commonPushXMod = 1,
    commonPushYMod = 1,
    commonOriginMod = 1,
    cellTypePushXMod = 1,
    cellTypePushYMod = 1,
    primaryCellPushFactor = 0,
    primaryCellPushFactorX = 0,
    primaryCellPushFactorY = 0,
    primaryDist,
    secondaryDist,
    centerDistRatio = 0,
    alignmentPushXMod = 1,
    alignmentPushYMod = 1,
    alignmentPushYModMod = 0,
    breathingStartTime,
    breathingTimestamp,
    breathingPushMod = 1,
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
    primaryCellWeight = 0,
    primaryCellWeightPushFactor = 1,
    pushSpeedFactor = 1,
    cell,
    i,
    x,
    y,
    l

  for (i = 0; i < cellsLen; ++i) {
    cell = cells[i]
    cell.localWeight = cell.weight
    cell.localCol = cell.col
    cell.localRow = cell.row
    cell.localX = cell.x
    cell.localY = cell.y
    cell.localIx = cell.ix
    cell.localIy = cell.iy
  }

  function force(alpha) {
    forceSetup(alpha)
    latticeForcePass(alpha) // lattice pass must run in isolation (for reasons)
    mainForcePass(alpha)

    sharedData.forceCenterX = centerX
    sharedData.forceCenterY = centerY
    sharedData.forceCenterStrengthMod = lerp(
      sharedData.forceCenterStrengthMod,
      min(basePushDistMod / 1.125, 1),
      // centerLerp,
      defaultLerpFactor,
    )
  }

  function forceSetup(alpha) {
    nextPrimaryCell = selectPrimary(cells)
    nextPrimaryCellIndex = nextPrimaryCell?.index
    if (nextPrimaryCellIndex !== primaryCellIndex) {
      prevPrimaryCell = primaryCell ?? nextPrimaryCell
      prevPrimaryCellX = prevPrimaryCell.localX + prevPrimaryCell.vx
      prevPrimaryCellY = prevPrimaryCell.localY + prevPrimaryCell.vy
      // prevPrimaryCellX =
      //   primaryCellX ?? prevPrimaryCell.localX + prevPrimaryCell.vx
      // prevPrimaryCellY =
      //   primaryCellX ?? prevPrimaryCell.localY + prevPrimaryCell.vy

      primaryCell = nextPrimaryCell
      primaryCellIndex = nextPrimaryCellIndex
      primaryCellCol = nextPrimaryCell.localCol
      primaryCellRow = nextPrimaryCell.localRow
      slowIdlePrimaryCellMod = 0
      idlePrimaryCellMod = 0
    }

    if (!primaryCell) return

    pointerSpeedScale = easedMinLerp(
      pointerSpeedScale,
      pointer.speedScale,
      defaultLerpFactor * 4,
    )
    complementPointerSpeedScale = 1 - pointerSpeedScale

    slowIdlePrimaryCellMod = easedMinLerp(
      slowIdlePrimaryCellMod,
      1,
      max(defaultLerpFactor, slowIdlePrimaryCellMod) *
        0.05 *
        complementPointerSpeedScale,
    )

    idlePrimaryCellMod = easedMinLerp(
      idlePrimaryCellMod,
      1,
      defaultLerpFactor * 4,
    )

    primaryCellX = primaryCell.localX + primaryCell.vx
    primaryCellY = primaryCell.localY + primaryCell.vy

    // todo tmp?
    if (smoothPrimaryCell && idlePrimaryCellMod < 1) {
      primaryCellX = lerp(prevPrimaryCellX, primaryCellX, idlePrimaryCellMod)
      primaryCellY = lerp(prevPrimaryCellY, primaryCellY, idlePrimaryCellMod)
    }

    centerX ??= primaryCellX
    centerY ??= primaryCellY
    pointerX = pointer?.x ?? primaryCellX
    pointerY = pointer?.y ?? primaryCellX

    easedIdlePointerMod = easedMinLerp(
      easedIdlePointerMod,
      pointerSpeedScale > 0 ? 0 : 1,
      defaultLerpFactor * (pointerSpeedScale > 0 ? 1 : 0.25),
    )
    easedActivePointerMod = 1 - easedIdlePointerMod

    nextVerySlowPointerMod =
      pointerSpeedScale <= 0.005 ? pointerSpeedScale / 0.005 : 1
    lastVerySlowPointerMod = verySlowPointerMod
    verySlowPointerMod = easedMinLerp(
      verySlowPointerMod,
      nextVerySlowPointerMod,
      nextVerySlowPointerMod > verySlowPointerMod
        ? defaultLerpFactor * 2
        : defaultLerpFactor,
    )

    slowPointerMod = easedMinLerp(
      slowPointerMod,
      pointerSpeedScale <= 0.05 ? pointerSpeedScale / 0.05 : 1,
      defaultLerpFactor,
    )

    centerLerp = easedMinLerp(
      defaultLerpFactor * 0.1,
      1,
      verySlowPointerMod,
      MIN_LERP_EASING_TYPES.easeInExpo,
      0.001,
    )

    targetCenterX = lerp(
      primaryCellX,
      pointerX,
      verySlowPointerMod * easedActivePointerMod,
    )
    targetCenterY = lerp(
      primaryCellY,
      pointerY,
      verySlowPointerMod * easedActivePointerMod,
    )

    prevCenterX = centerX
    prevCenterY = centerY

    centerX = easedMinLerp(centerX, targetCenterX, centerLerp)
    centerY = easedMinLerp(centerY, targetCenterY, centerLerp)

    latticeCenterX = centerX
    latticeCenterY = centerY

    secondaryCell =
      primaryCellIndex === pointer.indices[0]
        ? cells[pointer.indices[1]]
        : undefined
    if (secondaryCell) {
      secondaryCellX = secondaryCell.localX + secondaryCell.vx
      secondaryCellY = secondaryCell.localY + secondaryCell.vy

      primaryDist = dist(centerX, centerY, primaryCellX, primaryCellY)
      secondaryDist = dist(centerX, centerY, secondaryCellX, secondaryCellY)
      centerDistRatio = secondaryDist === 0 ? 0 : primaryDist / secondaryDist
    }

    primaryCellPushFactorX =
      primaryCellPushFactorY =
      primaryCellPushFactor =
        min(centerDistRatio, 1) * (1 - slowIdlePrimaryCellMod)

    if (breathing) {
      breathingTimestamp = performance.now()
      if (!breathingStartTime) breathingStartTime = breathingTimestamp
      breathingPushMod =
        1 -
        breathingVariability +
        diaphragmaticBreathing(
          ((breathingTimestamp - breathingStartTime) % breathingCycleDuration) /
            breathingCycleDuration,
        ) *
          breathingVariability *
          complementPointerSpeedScale
    }

    if (configPushSpeedFactor > 0) {
      pushSpeedFactor = easedMinLerp(
        pushSpeedFactor,
        lerp(max(complementPointerSpeedScale, 0.2), 1, slowIdlePrimaryCellMod),
        defaultLerpFactor,
      )
    }

    // todo messy
    if (manageWeights) {
      primaryCellWeight =
        clamp(0, 1, (1 - centerDistRatio) ** 2) *
        // breathingPushMod ** 2 *
        breathingPushMod *
        // (1 - breathingPushMod) *
        complementPointerSpeedScale *
        pushSpeedFactor
      primaryCellWeight =
        primaryCell.weight =
        primaryCell.localWeight =
          easedMinLerp(
            primaryCell.localWeight,
            primaryCellWeight,
            primaryCellWeight > primaryCell.localWeight
              ? defaultLerpFactor * sqrt(complementPointerSpeedScale)
              : defaultLerpFactor * 3,
          )

      // primaryCellWeightPushFactor =
      //   1 + clamp(0, 0.125, mapRange(0.25, 1, 0, 0.25, primaryCellWeight))

      primaryCellWeightPushFactor = easedMinLerp(
        primaryCellWeightPushFactor,
        1 + clamp(0, 0.125, mapRange(0.25, 1, 0, 0.25, primaryCellWeight)),
        defaultLerpFactor,
      )
    }

    if (
      primaryCellRow === secondaryCell?.localRow &&
      primaryCellRow === prevPrimaryCell?.localRow
    ) {
      alignmentPushYModMod = lerp(alignmentPushYModMod, 1, defaultLerpFactor)
    } else {
      alignmentPushYModMod = 0
    }

    if (requestMediaVersions) {
      if (pointerSpeedScale < mediaVMaxSpeedLimit) {
        primaryCell.targetMediaVersion = max(
          primaryCell.targetMediaVersion,
          maxTargetMediaVersion,
        )
      }
    }

    commonOriginMod = originStrength * alpha * (1 - (1 - breathingPushMod) * 3)

    basePushDistMod =
      breathingPushMod * pushSpeedFactor * primaryCellWeightPushFactor
    commonPushDistMod = basePushDistMod * pushStrength * alpha
    commonPushXMod = configPushXMod * breathingPushMod
    commonPushYMod = configPushYMod * (1 - (1 - sqrt(breathingPushMod)))
  }

  function mainForcePass(alpha) {
    for (i = 0; i < cellsLen; ++i) {
      cell = cells[i]

      // origin force
      cell.vx +=
        ((originLatticeScale === 1
          ? cell.localIx
          : (cell.localIx - latticeCenterX) * originLatticeScale +
            latticeCenterX) -
          cell.localX) *
        originXFactor *
        commonOriginMod
      cell.vy +=
        ((originLatticeScale === 1
          ? cell.localIy
          : (cell.localIy - latticeCenterY) * originLatticeScale +
            latticeCenterY) -
          cell.localY) *
        originYFactor *
        commonOriginMod

      if (primaryCell) {
        isPrimaryCell = i === primaryCellIndex

        x = cell.localX + cell.vx - centerX
        y = cell.localY + cell.vy - centerY
        l = x * x + y * y

        if (l !== 0 && (!pushRadiusLimit || l < pushRadius * pushRadius)) {
          l = sqrt(l)
          l = (pushRadius - l) / l
          l *= commonPushDistMod

          x *= l
          y *= l

          colLevelAdjacency = abs(cell.localCol - primaryCellCol)
          rowLevelAdjacency = abs(cell.localRow - primaryCellRow)
          greatestDirLevelAdjacency = max(colLevelAdjacency, rowLevelAdjacency)

          // media loading logic, might move it at some point
          if (!isPrimaryCell && requestMediaVersions) {
            handleCellMediaVersions(
              cell,
              pointerSpeedScale,
              colLevelAdjacency,
              rowLevelAdjacency,
            )
          }

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
              centerXStretchMod +=
                pushCenterXStretchMod *
                ((colLevelAdjacency / pushCenterXStretchMaxLevelsX) *
                  (1 - rowLevelAdjacency / pushCenterXStretchMaxLevelsY)) *
                abs(x)
            }
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
            commonPushXMod *
            cellTypePushXMod *
            alignmentPushXMod *
            centerXStretchMod

          cell.vy += y * commonPushYMod * cellTypePushYMod * alignmentPushYMod
        }
      }

      if (cell.localWeight !== 0 && i !== primaryCellIndex) {
        cell.weight = cell.localWeight = easedMinLerp(
          cell.localWeight,
          0,
          defaultLerpFactor * 4,
        )
      }

      handleEnd?.(cell)
    }
  }

  function latticeForcePass(alpha) {
    if (!primaryCell) return

    minLatticeRow = max(primaryCellRow - latticeMaxLevelsFromPrimary, 1)
    maxLatticeRow = min(
      primaryCellRow + latticeMaxLevelsFromPrimary,
      latticeRows,
    )
    minLatticeCol = max(primaryCellCol - latticeMaxLevelsFromPrimary, 1)
    maxLatticeCol = min(
      primaryCellCol + latticeMaxLevelsFromPrimary,
      latticeCols,
    )

    // much faster than looping through all cells
    for (latticeCol = minLatticeCol; latticeCol < maxLatticeCol; latticeCol++) {
      for (
        latticeRow = minLatticeRow;
        latticeRow < maxLatticeRow;
        latticeRow++
      ) {
        i = latticeRow * latticeCols + latticeCol
        if (i < cellsLen) {
          cell = cells[i]

          colLevelAdjacency = abs(cell.localCol - primaryCellCol)
          rowLevelAdjacency = abs(cell.localRow - primaryCellRow)
          greatestDirLevelAdjacency = max(colLevelAdjacency, rowLevelAdjacency)
          latticeStrengthMod =
            (latticeMaxLevelsFromPrimary - greatestDirLevelAdjacency) /
            latticeMaxLevelsFromPrimary

          // left
          latticeLinkForce(
            cell,
            cells[i - 1],
            alpha,
            latticeCellWidth * latticeCellWidthMod,
            latticeStrengthMod,
          )

          // top
          latticeLinkForce(
            cell,
            cells[i - latticeCols],
            alpha,
            latticeCellHeight * latticeCellHeightMod,
            latticeStrengthMod,
          )
        }
      }
    }
  }

  function latticeLinkForce(cell, target, alpha, size, strengthMod) {
    x = target.localX + target.initialVx - cell.localX - cell.initialVx
    y = target.localY + target.initialVy - cell.localY - cell.initialVy

    l = sqrt(x * x + y * y)
    l =
      ((l - size) / l) *
      alpha *
      latticeStrength *
      strengthMod *
      0.5 *
      (1 - (1 - breathingPushMod) * 5)
    x *= l * latticeXFactor
    y *= l * latticeYFactor

    target.vx -= x
    target.vy -= y
    cell.vx += x
    cell.vy += y
  }

  return force
}
