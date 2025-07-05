// @ts-nocheck
// ^ the huge destructuring of function args causes tsc to hang
import {
  MIN_LERP_EASING_TYPES,
  clamp,
  easedMinLerp,
  lerp,
  mapRange,
  minLerp,
} from '../../../../utils'
import { diaphragmaticBreathing } from './utils/diaphragmatic-breathing'

const LERP_FACTOR_DEFAULT = 0.025

const { abs, max, min, sqrt, pow } = Math

const squaredDist = (x1, y1, x2, y2) => pow(x2 - x1, 2) + pow(y2 - y1, 2)
const dist = (x1, y1, x2, y2) => sqrt(squaredDist(x1, y1, x2, y2))
const dist2d = (a, b) => dist(a.x, a.y, b.x, b.y)

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
      // dynamic but less performant fn
      handleDynamicCellMediaVersions = (
        cell,
        speedScale,
        colLevelAdjacency,
        rowLevelAdjacency,
      ) => {
        if (speedScale > mediaHighestSpeedLimit) return
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
      },
      // hardcoded but more performant fn
      handleCellMediaVersions = (
        cell,
        speedScale,
        colLevelAdjacency,
        rowLevelAdjacency,
      ) => {
        if (speedScale > mediaHighestSpeedLimit) return

        if (
          maxTargetMediaVersion >= 3 &&
          speedScale < mediaV3SpeedLimit &&
          colLevelAdjacency <= mediaV3ColLevelAdjacencyThreshold &&
          rowLevelAdjacency <= mediaV3RowLevelAdjacencyThreshold
        ) {
          cell.targetMediaVersion = 3
        } else if (
          speedScale < mediaV2SpeedLimit &&
          colLevelAdjacency <= mediaV2ColLevelAdjacencyThreshold &&
          rowLevelAdjacency <= mediaV2RowLevelAdjacencyThreshold
        ) {
          cell.targetMediaVersion = max(cell.targetMediaVersion, 2)
        } else if (
          speedScale < mediaV1SpeedLimit &&
          colLevelAdjacency <= mediaV1ColLevelAdjacencyThreshold &&
          rowLevelAdjacency <= mediaV1RowLevelAdjacencyThreshold
        ) {
          cell.targetMediaVersion = max(cell.targetMediaVersion, 1)
        } else {
          cell.targetMediaVersion = min(cell.targetMediaVersion, 1) // reduce res if out of range (free mipmapping)
        }
      },
    } = {},
    push: {
      strength: _pushStrength = 1,
      // pushStrength = _pushStrength,
      pushStrength = _pushStrength * 0.5,
      radius: pushRadius = getPushRadius(dimensions),
      pushRadius2 = pushRadius * pushRadius,
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
      strength: _latticeStrength = 0.8,
      latticeStrength = _latticeStrength * 0.5,
      xFactor: latticeXFactor = 1,
      yFactor: latticeYFactor = 1,
      maxLevelsFromPrimary: latticeMaxLevelsFromPrimary = 30,
      cellWidth: latticeCellWidth = globalConfig.lattice.cellWidth,
      cellHeight: latticeCellHeight = globalConfig.lattice.cellHeight,
      cellSizeMod: latticeCellSizeMod = 1,
      cellWidthMod: latticeCellWidthMod = latticeCellSizeMod,
      cellHeightMod: latticeCellHeightMod = latticeCellSizeMod,
      latticeCellSizeX = latticeCellWidth * latticeCellSizeMod,
      latticeCellSizeY = latticeCellHeight * latticeCellSizeMod,
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
  handleEnd = () => {},
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
    easedSlowIdlePrimaryCellModComplement = 0,
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
    primaryCellPushFactor = 0,
    primaryCellPushFactorX = 0,
    primaryCellPushFactorY = 0,
    primaryDist,
    secondaryDist,
    centerDistRatio = 0,
    alignmentPushYModMod = 0,
    breathingStartTime,
    breathingTimestamp,
    breathingPushMod = 1,
    minLatticeRow,
    maxLatticeRow,
    minLatticeCol,
    maxLatticeCol,
    latticeRow,
    latticeCol,
    latticeStrengthMod,
    isPrimaryCell = false,
    primaryCellWeight = 0,
    primaryCellWeightPushFactor = 1,
    pushSpeedFactor = 1,
    cell,
    i,
    x,
    y,
    vx,
    vy,
    l

  for (i = 0; i < cellsLen; ++i) {
    cell = cells[i]
    initLocalCellProperties(cell)
    resetPrimaryCellDependentTransientCellProperties(cell)
  }

  function force(alpha) {
    handlePrimaryCellChange(alpha)
    forceSetup(alpha)
    latticeForcePass(alpha) // lattice pass must run in isolation (for reasons)
    mainForcePass(alpha)

    sharedData.centerForceX = centerX
    sharedData.centerForceY = centerY
    sharedData.centerForceStrengthMod = lerp(
      sharedData.centerForceStrengthMod,
      min(basePushDistMod / 1.125, 1),
      // centerLerp,
      defaultLerpFactor * 4,
    )
  }

  function handlePrimaryCellChange(alpha) {
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
      if (!primaryCell) return
      primaryCellCol = primaryCell.localCol
      primaryCellRow = primaryCell.localRow

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

      slowIdlePrimaryCellMod = 0
      idlePrimaryCellMod = 0
      // verySlowPointerMod = 0
      // slowPointerMod = 0
    }
  }

  function initLocalCellProperties(cell) {
    cell.localWeight = cell.weight
    cell.localCol = cell.col
    cell.localRow = cell.row
    cell.localX = cell.x
    cell.localY = cell.y
    cell.localIx = cell.ix
    cell.localIy = cell.iy
  }

  function resetPrimaryCellDependentTransientCellProperties(cell) {
    cell.primaryCellIndex = undefined
    cell.colLevelAdjacency = undefined
    cell.rowLevelAdjacency = undefined
    cell.latticeStrengthMod = undefined
    cell.centerXStretchMod = undefined
    cell.alignmentPushYMod = undefined
  }

  function updatePrimaryCellDependentTransientCellProperties(cell) {
    cell.primaryCellIndex = primaryCellIndex

    cell.colLevelAdjacency = abs(cell.localCol - primaryCellCol)
    cell.rowLevelAdjacency = abs(cell.localRow - primaryCellRow)

    cell.latticeStrengthMod =
      latticeStrength *
      (1 - (1 - breathingPushMod) * 5) *
      ((latticeMaxLevelsFromPrimary -
        max(cell.colLevelAdjacency, cell.rowLevelAdjacency)) /
        latticeMaxLevelsFromPrimary)

    if (
      // !isPrimaryCell &&
      pushCenterXStretchMod > 0 &&
      cell.rowLevelAdjacency < pushCenterXStretchMaxLevelsY &&
      cell.colLevelAdjacency > 0 &&
      cell.colLevelAdjacency < pushCenterXStretchMaxLevelsX
    ) {
      cell.centerXStretchMod =
        pushCenterXStretchMod *
        ((cell.colLevelAdjacency / pushCenterXStretchMaxLevelsX) *
          (1 - cell.rowLevelAdjacency / pushCenterXStretchMaxLevelsY))
    } else {
      cell.centerXStretchMod = undefined
    }

    if (
      pushAlignmentMaxLevelsX > 0 &&
      secondaryCell &&
      prevPrimaryCell &&
      cell.rowLevelAdjacency === 0 &&
      cell.colLevelAdjacency < pushAlignmentMaxLevelsX
    ) {
      cell.alignmentPushYMod =
        (pushAlignmentMaxLevelsX - max(cell.colLevelAdjacency, 1)) /
        pushAlignmentMaxLevelsX
    } else {
      cell.alignmentPushYMod = undefined
    }
  }

  function forceSetup(alpha) {
    if (!primaryCell) return

    pointerSpeedScale = minLerp(
      pointerSpeedScale,
      pointer.speedScale,
      defaultLerpFactor * 4,
    )
    complementPointerSpeedScale = 1 - pointerSpeedScale

    slowIdlePrimaryCellMod = minLerp(
      slowIdlePrimaryCellMod,
      1,
      max(defaultLerpFactor, slowIdlePrimaryCellMod) *
        0.05 *
        complementPointerSpeedScale,
    )

    easedSlowIdlePrimaryCellModComplement = minLerp(
      easedSlowIdlePrimaryCellModComplement,
      1 - slowIdlePrimaryCellMod,
      defaultLerpFactor,
    )

    idlePrimaryCellMod = minLerp(idlePrimaryCellMod, 1, defaultLerpFactor * 4)
    // idlePrimaryCellMod = minLerp(idlePrimaryCellMod, 1, defaultLerpFactor)

    primaryCellX = primaryCell.localX + primaryCell.vx
    primaryCellY = primaryCell.localY + primaryCell.vy

    // todo tmp?
    if (smoothPrimaryCell && idlePrimaryCellMod < 1) {
      // console.log('idlePrimaryCellMod', idlePrimaryCellMod)
      primaryCellX = lerp(prevPrimaryCellX, primaryCellX, idlePrimaryCellMod)
      primaryCellY = lerp(prevPrimaryCellY, primaryCellY, idlePrimaryCellMod)
    }

    centerX ??= primaryCellX
    centerY ??= primaryCellY
    pointerX = pointer?.x ?? primaryCellX
    pointerY = pointer?.y ?? primaryCellX

    easedIdlePointerMod = minLerp(
      easedIdlePointerMod,
      pointerSpeedScale > 0 ? 0 : 1,
      defaultLerpFactor * (pointerSpeedScale > 0 ? 1 : 0.25),
    )
    easedActivePointerMod = 1 - easedIdlePointerMod

    nextVerySlowPointerMod =
      pointerSpeedScale <= 0.005 ? pointerSpeedScale / 0.005 : 1
    lastVerySlowPointerMod = verySlowPointerMod
    verySlowPointerMod = minLerp(
      verySlowPointerMod,
      nextVerySlowPointerMod,
      nextVerySlowPointerMod > verySlowPointerMod
        ? defaultLerpFactor * 2
        : defaultLerpFactor,
    )

    slowPointerMod = minLerp(
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

    centerX = minLerp(centerX, targetCenterX, centerLerp)
    centerY = minLerp(centerY, targetCenterY, centerLerp)

    latticeCenterX = centerX
    latticeCenterY = centerY

    secondaryCell =
      primaryCellIndex === pointer.indices[0]
        ? cells[pointer.indices[1]]
        : undefined
    if (secondaryCell) {
      secondaryCellX = secondaryCell.localX + secondaryCell.vx
      secondaryCellY = secondaryCell.localY + secondaryCell.vy

      primaryDist = squaredDist(centerX, centerY, primaryCellX, primaryCellY)
      secondaryDist = squaredDist(
        centerX,
        centerY,
        secondaryCellX,
        secondaryCellY,
      )
      centerDistRatio = secondaryDist === 0 ? 0 : primaryDist / secondaryDist
    }

    primaryCellPushFactorX =
      primaryCellPushFactorY =
      primaryCellPushFactor =
        // min(centerDistRatio, 1) * (1 - slowIdlePrimaryCellMod)
        min(centerDistRatio, 1) * easedSlowIdlePrimaryCellModComplement

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
      pushSpeedFactor = minLerp(
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
          minLerp(
            primaryCell.localWeight,
            primaryCellWeight,
            primaryCellWeight > primaryCell.localWeight
              ? defaultLerpFactor * sqrt(complementPointerSpeedScale)
              : defaultLerpFactor * 3,
          )

      // primaryCellWeightPushFactor =
      //   1 + clamp(0, 0.125, mapRange(0.25, 1, 0, 0.25, primaryCellWeight))

      primaryCellWeightPushFactor = minLerp(
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

      isPrimaryCell = i === primaryCellIndex
      if (primaryCell) {
        x = cell.localX + cell.vx - centerX
        y = cell.localY + cell.vy - centerY

        l = x * x + y * y

        // if (l !== 0 && (!pushRadiusLimit || l < pushRadius2)) {
        if (l < pushRadius2) {
          l = sqrt(l)
          l = (pushRadius - l) / l

          // l = (pushRadius2 - l) / l
          // l = sqrt(l)
          // l = approxSqrt(l)

          l *= commonPushDistMod

          x *= l
          y *= l

          if (cell.primaryCellIndex !== primaryCellIndex) {
            updatePrimaryCellDependentTransientCellProperties(cell)
          }

          // media loading logic, might move it at some point
          if (requestMediaVersions) {
            if (!isPrimaryCell) {
              handleCellMediaVersions(
                cell,
                pointerSpeedScale,
                cell.colLevelAdjacency,
                cell.rowLevelAdjacency,
              )
            } else {
              if (pointerSpeedScale < mediaVMaxSpeedLimit) {
                primaryCell.targetMediaVersion = max(
                  primaryCell.targetMediaVersion,
                  maxTargetMediaVersion,
                )
              }
            }
          }

          // push force
          vx = x * commonPushXMod
          vy = y * commonPushYMod

          if (cell.centerXStretchMod) {
            vx *= 1 + cell.centerXStretchMod * abs(x)
          }
          if (cell.alignmentPushYMod) {
            vy *= 1 - cell.alignmentPushYMod * alignmentPushYModMod
          }
          if (isPrimaryCell) {
            vx *= primaryCellPushFactorX
            vy *= primaryCellPushFactorY
          }

          cell.vx += vx
          cell.vy += vy
        }
      }

      if (cell.localWeight !== 0 && !isPrimaryCell) {
        cell.weight = cell.localWeight = minLerp(
          cell.localWeight,
          0,
          defaultLerpFactor * 4,
        )
      }

      handleEnd(cell)
    }
  }

  function latticeForcePass(alpha) {
    if (!primaryCell) return

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

          if (cell.primaryCellIndex !== primaryCellIndex) {
            // isPrimaryCell = i === primaryCellIndex
            updatePrimaryCellDependentTransientCellProperties(cell)
          }

          // left
          latticeLinkForce(
            cell,
            cells[i - 1],
            alpha,
            latticeCellSizeX,
            latticeStrengthMod,
          )

          // top
          latticeLinkForce(
            cell,
            cells[i - latticeCols],
            alpha,
            latticeCellSizeY,
            latticeStrengthMod,
          )
        }
      }
    }
  }

  function latticeLinkForce(cell, target, alpha, size) {
    x = target.localX + target.initialVx - cell.localX - cell.initialVx
    y = target.localY + target.initialVy - cell.localY - cell.initialVy

    l = sqrt(x * x + y * y)
    l = ((l - size) / l) * alpha * cell.latticeStrengthMod
    x *= l * latticeXFactor
    y *= l * latticeYFactor

    target.vx -= x
    target.vy -= y
    cell.vx += x
    cell.vy += y
  }

  return force
}
