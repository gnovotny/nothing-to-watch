// @ts-nocheck
// ^ the huge destructuring of function args causes tsc to hang
import { clamp, easedMinLerp, lerp, mapRange } from '../../../../utils'
import { diaphragmaticBreathing } from './utils/diaphragmatic-breathing'

const LERP_FACTOR_DEFAULT = 0.025

const { abs, max, min, sqrt } = Math

const getPushRadius = (dimensions) => {
  return dimensions.get('diagonal')

  // // const dimensionsScale = 0.5
  // const dimensionsScale = 1
  // const aspect = dimensions.get('aspect')
  // const relativeAspect = aspect >= 1 ? aspect : 1 / aspect
  // const minScale = Math.min(Math.max(relativeAspect * 0.75, 1), 2.5)
  // let min = dimensions.get('width') * dimensionsScale
  // let max = dimensions.get('height') * dimensionsScale
  // if (min > max) [min, max] = [max, min]
  // return Math.min(max, min * minScale)
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
    pointer: {
      lerpCenterToPrimaryCellOnIdle:
        lerpCenterToPrimaryCellOnIdlePointer = true,
      // idleDelay: idlePointerDelay = 500,
      idleDelay: idlePointerDelay = 0,
    } = {},
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
      maxTargetVersion: maxTargetMediaVersion = mediaVersionCount - 1,
      cellTargetMediaVersion = 0,
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
      vMaxSpeedLimit: mediaVMaxSpeedLimit = maxTargetMediaVersion === 3
        ? mediaV3SpeedLimit
        : mediaV2SpeedLimit,
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
      highestSpeedLimit: mediaHighestSpeedLimit = validMediaVersions[
        validMediaVersions.length - 1
      ].speedLimit,
      handleCellMediaVersions = (
        cell,
        pointerSpeedScale,
        colLevelAdjacency,
        rowLevelAdjacency,
      ) => {
        if (pointerSpeedScale > mediaHighestSpeedLimit) return
        /** dynamic but possibly less performant fn **/
        for (let i = 0; i < validMediaVersions.length; ++i) {
          mediaVersion = validMediaVersions[i]

          if (
            pointerSpeedScale < mediaVersion.speedLimit &&
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
        //   pointerSpeedScale < mediaV2SpeedLimit &&
        //   colLevelAdjacency <= mediaV2ColLevelAdjacencyThreshold &&
        //   rowLevelAdjacency <= mediaV2RowLevelAdjacencyThreshold
        // ) {
        //   cell.targetMediaVersion = max(cell.targetMediaVersion, 2)
        // } else if (
        //   pointerSpeedScale < mediaV1SpeedLimit &&
        //   colLevelAdjacency <= mediaV1ColLevelAdjacencyThreshold &&
        //   rowLevelAdjacency <= mediaV1RowLevelAdjacencyThreshold
        // ) {
        //   cell.targetMediaVersion = max(cell.targetMediaVersion, 1)
        //   // cell.targetMediaVersion = 1 // reduce res if out of range (free mipmapping)
        // } else {
        //   if (pointerSpeedScale < mediaV1SpeedLimit) {
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

  let centerX,
    centerY,
    latticeCenterX = originLatticeX,
    latticeCenterY = originLatticeY,
    centerLerp = defaultLerpFactor,
    primaryCell,
    newPrimaryCell,
    prevPrimaryCell,
    primaryCellX,
    primaryCellY,
    secondaryCell,
    secondaryCellX,
    secondaryCellY,
    cellTypePushXMod = 1,
    cellTypePushYMod = 1,
    primaryCellPushFactorX = 0,
    primaryCellPushFactorY = 0,
    centerToPrimaryCellDist,
    centerToSecondaryCellDist,
    targetCenterToPrimaryCellDist,
    prevTargetCenterToPrimaryCellDist,
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
    relativePointerSpeedScale = 0,
    newRelativePointerSpeedScale = 0,
    idlePointerTimeout,
    idleLerpCenterToPrimaryCell = false,
    primaryCellWeight = 0,
    primaryCellWeightPushFactor = 1,
    pushSpeedFactor = 1

  function force(alpha) {
    forceSetup(alpha)
    latticeForcePass(alpha) // lattice pass must run in isolation
    mainForcePass(alpha)

    sharedData.forceCenterX = centerX
    sharedData.forceCenterY = centerY
  }

  function forceSetup(alpha) {
    newPrimaryCell = selectPrimary(cells)
    if (newPrimaryCell?.index !== primaryCell?.index) {
      prevPrimaryCell = primaryCell
      primaryCell = newPrimaryCell
    }

    if (!primaryCell) return

    // pointerSpeedScale = pointer.speedScale
    pointerSpeedScale = easedMinLerp(pointerSpeedScale, pointer.speedScale, 0.1)

    // console.log('pointerSpeedScale', pointerSpeedScale)
    inversePointerSpeedScale = 1 - pointerSpeedScale

    if (breathing) {
      timestamp = performance.now()
      if (!startTime) startTime = timestamp
      breathingPushMod =
        1 -
        breathingVariability +
        diaphragmaticBreathing(
          ((timestamp - startTime) % breathingCycleDuration) /
            breathingCycleDuration,
        ) *
          breathingVariability *
          inversePointerSpeedScale
    }

    if (requestMediaVersions) {
      if (pointerSpeedScale < mediaVMaxSpeedLimit) {
        primaryCell.targetMediaVersion = max(
          primaryCell.targetMediaVersion,
          maxTargetMediaVersion,
        )
      }
    }

    if (configPushSpeedFactor > 0) {
      pushSpeedFactor = easedMinLerp(
        pushSpeedFactor,
        max(inversePointerSpeedScale, 0.2),
        defaultLerpFactor,
      )
    }

    primaryCellX = primaryCell.x + primaryCell.vx
    primaryCellY = primaryCell.y + primaryCell.vy
    centerX ??= primaryCellX
    centerY ??= primaryCellY

    // centerLerp = easedMinLerp(
    //     centerLerp,
    //     inversePointerSpeedScale,
    //     // pointerSpeedScale,
    //     // max(
    //     //   pointerSpeedScale * pointerSpeedScale * defaultLerpFactor * 20,
    //     //   defaultLerpFactor,
    //     // ),
    //     defaultLerpFactor,
    // )
    // centerLerp = inversePointerSpeedScale
    // centerLerp = defaultLerpFactor
    // centerLerp = 1
    centerLerp = max(defaultLerpFactor, inversePointerSpeedScale)

    newRelativePointerSpeedScale =
      pointerSpeedScale <= 0.005 ? pointerSpeedScale / 0.005 : 1

    relativePointerSpeedScale = easedMinLerp(
      relativePointerSpeedScale,
      newRelativePointerSpeedScale,
      newRelativePointerSpeedScale > relativePointerSpeedScale
        ? max(relativePointerSpeedScale / newRelativePointerSpeedScale, 0.1) *
            defaultLerpFactor
        : defaultLerpFactor,
      // defaultLerpFactor *
      //   max(newRelativePointerSpeedScale, 0.5),
    )

    // console.log('pointerSpeedScale', pointerSpeedScale)
    // console.log('relativePointerSpeedScale', relativePointerSpeedScale)

    centerX = easedMinLerp(
      centerX,
      lerp(primaryCellX, pointer?.x ?? primaryCellX, relativePointerSpeedScale),
      // defaultLerpFactor,
      // inversePointerSpeedScale,
      centerLerp,
    )

    centerY = easedMinLerp(
      centerY,
      lerp(primaryCellY, pointer?.y ?? primaryCellY, relativePointerSpeedScale),
      // defaultLerpFactor,
      // inversePointerSpeedScale,
      centerLerp,
    )

    latticeCenterX = centerX
    latticeCenterY = centerY

    // centerX = easedMinLerp(centerX, primaryCellX, defaultLerpFactor)
    // centerY = easedMinLerp(centerY, primaryCellY, defaultLerpFactor)
    //
    // console.log('centerLerp', centerLerp)
    // // console.log('inversePointerSpeedScale', inversePointerSpeedScale)
    //
    // // centerLerp = max(
    // //   pointerSpeedScale * pointerSpeedScale * defaultLerpFactor * 20,
    // //   defaultLerpFactor,
    // // )
    //
    // centerLerp = easedMinLerp(
    //   centerLerp,
    //   inversePointerSpeedScale,
    //   // max(
    //   //   pointerSpeedScale * pointerSpeedScale * defaultLerpFactor * 20,
    //   //   defaultLerpFactor,
    //   // ),
    //   defaultLerpFactor * 0.01,
    // )
    //
    // console.log('centerLerp', centerLerp)
    //
    // // console.log('centerLerp', centerLerp)
    //
    // centerX = easedMinLerp(
    //   centerX,
    //   pointer?.x ?? primaryCellX,
    //   // defaultLerpFactor,
    //   // inversePointerSpeedScale,
    //   centerLerp,
    // )
    // centerY = easedMinLerp(
    //   centerY,
    //   pointer?.y ?? primaryCellY,
    //   // defaultLerpFactor,
    //   // inversePointerSpeedScale,
    //   centerLerp,
    // )

    // if (lerpCenterToPrimaryCellOnIdlePointer && pointerSpeedScale === 0) {
    //   // if (pointerSpeedScale < 0.05) {
    //   // centerX = primaryCellX
    //   // centerY = primaryCellY
    //   centerX = easedMinLerp(centerX, primaryCellX, defaultLerpFactor)
    //   centerY = easedMinLerp(centerY, primaryCellY, defaultLerpFactor)
    //
    //   centerLerp = easedMinLerp(centerLerp, 0, defaultLerpFactor)
    //
    //   console.log('centerLerp', centerLerp)
    // } else {
    //   // console.log('inversePointerSpeedScale', inversePointerSpeedScale)
    //
    //   // centerLerp = max(
    //   //   pointerSpeedScale * pointerSpeedScale * defaultLerpFactor * 20,
    //   //   defaultLerpFactor,
    //   // )
    //
    //   centerLerp = easedMinLerp(
    //     centerLerp,
    //     inversePointerSpeedScale,
    //     // max(
    //     //   pointerSpeedScale * pointerSpeedScale * defaultLerpFactor * 20,
    //     //   defaultLerpFactor,
    //     // ),
    //     defaultLerpFactor * 0.01,
    //   )
    //
    //   console.log('centerLerp', centerLerp)
    //
    //   // console.log('centerLerp', centerLerp)
    //
    //   centerX = easedMinLerp(
    //     centerX,
    //     pointer?.x ?? primaryCellX,
    //     // defaultLerpFactor,
    //     // inversePointerSpeedScale,
    //     centerLerp,
    //   )
    //   centerY = easedMinLerp(
    //     centerY,
    //     pointer?.y ?? primaryCellY,
    //     // defaultLerpFactor,
    //     // inversePointerSpeedScale,
    //     centerLerp,
    //   )
    // }

    secondaryCell =
      primaryCell?.index === pointer.indices[0]
        ? cells[pointer.indices[1]]
        : undefined

    distRatio = 0

    if (secondaryCell) {
      x = centerX - primaryCellX
      y = centerY - primaryCellY
      centerToPrimaryCellDist = sqrt(x * x + y * y)
      secondaryCellX = secondaryCell.x + secondaryCell.vx
      secondaryCellY = secondaryCell.y + secondaryCell.vy
      x = centerX - secondaryCellX
      y = centerY - secondaryCellY
      centerToSecondaryCellDist = sqrt(x * x + y * y)
      distRatio =
        centerToPrimaryCellDist / max(centerToSecondaryCellDist, 0.00001)

      // console.log('distRatio', distRatio)
    }

    primaryCellPushFactorX = primaryCellPushFactorY = Math.min(distRatio, 1)

    if (manageWeights) {
      primaryCellWeight =
        clamp(0, 1, (1 - distRatio) ** 2) *
        // breathingPushMod ** 2 *
        breathingPushMod *
        // (1 - breathingPushMod) *
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
      cell.vx +=
        ((originLatticeScale === 1
          ? cell.ix
          : (cell.ix - latticeCenterX) * originLatticeScale + latticeCenterX) -
          cell.x) *
        originStrength *
        alpha *
        originXFactor *
        (1 - (1 - breathingPushMod) * 3)
      cell.vy +=
        ((originLatticeScale === 1
          ? cell.iy
          : (cell.iy - latticeCenterY) * originLatticeScale + latticeCenterY) -
          cell.y) *
        originStrength *
        alpha *
        originYFactor *
        (1 - (1 - breathingPushMod) * 3)

      if (primaryCell) {
        isPrimaryCell = i === primaryCell.index

        colLevelAdjacency = abs(cell.col - primaryCell.col)
        rowLevelAdjacency = abs(cell.row - primaryCell.row)
        greatestDirLevelAdjacency = max(colLevelAdjacency, rowLevelAdjacency)

        x = cell.x + cell.vx - centerX
        y = cell.y + cell.vy - centerY
        l = x * x + y * y

        if (l !== 0 && (!pushRadiusLimit || l < pushRadius * pushRadius)) {
          l = sqrt(l)
          // media loading logic, might move it at some point
          if (!isPrimaryCell && requestMediaVersions) {
            handleCellMediaVersions(
              cell,
              pointerSpeedScale,
              colLevelAdjacency,
              rowLevelAdjacency,
            )
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
            centerXStretchMod *
            breathingPushMod
          cell.vy +=
            y *
            configPushYMod *
            cellTypePushYMod *
            alignmentPushYMod *
            (1 - (1 - sqrt(breathingPushMod)))
        }
      }

      if (cell.weight !== 0 && i !== primaryCell?.index) {
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
      latticeRows,
    )
    minLatticeCol = max(primaryCell.col - latticeMaxLevelsFromPrimary, 1)
    maxLatticeCol = min(
      primaryCell.col + latticeMaxLevelsFromPrimary,
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
    x = target.x + target.initialVx - cell.x - cell.initialVx
    y = target.y + target.initialVy - cell.y - cell.initialVy

    l = sqrt(x * x + y * y)
    l =
      ((l - size) / l) *
      alpha *
      latticeStrength *
      strengthMod *
      0.5 *
      (1 - (1 - breathingPushMod) * 5)
    // * (1 + 1 - breathingPushMod)
    x *= l * latticeXFactor
    y *= l * latticeYFactor

    target.vx -= x
    target.vy -= y
    cell.vx += x
    cell.vy += y
  }

  return force
}
