import { isNumber, lerp, mapRange } from '../../../../utils'

export const superForce = ({
  cells,
  dimensions,
  pointer,
  config: {
    push: {
      enabled: pushEnabled = false,
      strength: pushStrength = 1,
      strengthScaling: pushStrengthScaling = 0.1,
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
      radius: pushRadius = () => dimensions.get('diagonal'),
      radiusScaling: pushRadiusScaling = 1,
      xFactor: pushXFactor = 1,
      yFactor: pushYFactor = 1,
      diagonalFactor: pushDiagonalFactor = 1,
      manageMediaVersions: pushManageMediaVersions = true,
      skipYOnCenterCellRow: pushSkipYOnCenterCellRow = false,
    } = {},
    lattice: {
      enabled: latticeEnabled = false,
      strength: latticeStrength = 0.8,
      xFactor: latticeXFactor = 1,
      yFactor: latticeYFactor = 1,
      maxLevelsFromCenter: latticeMaxLevelsFromCenter = 4,
    } = {},
    origin: {
      enabled: originEnabled = false,
      strength: originStrength = 0.8,
      xFactor: originXFactor = 1,
      yFactor: originYFactor = 1,
    } = {},
  },
  globalConfig,
}) => {
  const select = (cells) => cells[pushSelector]

  // biome-ignore lint/style/useSingleVarDeclarator: annoying
  let centerCell,
    centerX,
    centerY,
    targetCenterX,
    targetCenterY,
    centerCellX,
    centerCellY,
    r,
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
    maxLevelAdjacency

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

  function force(alpha) {
    // centerCell = select(cells) ?? lastKnownCenterCell
    // lastKnownCenterCell = centerCell
    centerCell = select(cells)

    // if (!centerCell) {
    //   // centerX = undefined
    //   // centerY = undefined
    //   // targetCenterX = undefined
    //   // targetCenterY = undefined
    //   return
    // }

    const limit = false

    if (centerCell) {
      if (mediaEnabled) {
        centerCell.targetMediaVersion = 2
      }

      r = +pushRadius(centerCell, centerCell.index, cells) * pushRadiusScaling

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

      const pointerFollowActive =
        pushPointerFollow.enabled && pushPointerFollow.scaling && hasPointer

      if (pointerFollowActive) {
        if (pushPointerFollow.x)
          centerX = lerp(centerX, pointer.x, pushPointerFollow.scaling)
        if (pushPointerFollow.y)
          centerY = lerp(centerY, pointer.y, pushPointerFollow.scaling)
      }

      const pointerFollowAltActive =
        pushPointerFollowAlt.enabled &&
        pushPointerFollowAlt.scaling &&
        hasPointer

      if (pointerFollowAltActive) {
        if (pushPointerFollowAlt.x)
          centerX = lerp(centerX, pointer.x, pushPointerFollowAlt.scaling)
        if (pushPointerFollowAlt.y)
          centerY = lerp(centerY, pointer.y, pushPointerFollowAlt.scaling)
      }

      centerX = centerX ?? targetCenterX
      centerY = centerY ?? targetCenterY
      centerX = lerp(
        centerX,
        targetCenterX,
        Math.min(1, Math.abs(targetCenterX - centerX) / 10),
        // 0.1,
      )

      centerY = lerp(
        centerY,
        targetCenterY,
        Math.min(1, Math.abs(targetCenterY - centerY) / 10),
        // 0.1,
      )

      // TODO TMP
      // centerX = centerCellX
      centerY = centerCellY
    }

    let pointerFollowModX = 1
    let pointerFollowModY = 1

    for (i = 0; i < cells.length; ++i) {
      cell = cells[i]

      if (originEnabled) {
        cell.vx += (cell.ix - cell.x) * originStrength * alpha * originXFactor
        cell.vy += (cell.iy - cell.y) * originStrength * alpha * originYFactor
      }

      if (!centerCell) {
        continue
      }

      colLevelAdjacency = Math.abs(cell.col - centerCell.col)
      rowLevelAdjacency = Math.abs(cell.row - centerCell.row)

      maxLevelAdjacency = Math.max(colLevelAdjacency, rowLevelAdjacency)

      pointerFollowModX = 1
      pointerFollowModY = 1
      // if (i === centerCell.index) {
      //   continue
      // }
      // if (i === centerCell.index) {
      //   // if (!pointerFollowAltActive) {
      //   //   continue
      //   // } else {
      //   //   pointerFollowMod = 0.25
      //   // }
      //
      //   const midX = (cell.x + cell.vx + centerCellX) * 0.5
      //   const midY = (cell.x + cell.vx + centerCellY) * 0.5
      //
      //   pointerFollowModX = mapRange(centerCellX, midX, 0, 1, centerX)
      //   pointerFollowModY = mapRange(centerCellY, midY, 0, 1, centerY)
      // }

      if (pushEnabled) {
        x = cell.x + cell.vx - centerX
        y = cell.y + cell.vy - centerY

        let diagonalMod = 1
        if (pushDiagonalFactor !== 1) {
          const absX = Math.abs(x)
          const absY = Math.abs(y)

          diagonalMod = mapRange(
            0,
            1,
            1,
            pushDiagonalFactor,
            Math.min(absX, absY) / Math.max(absX, absY),
          )
        }

        l = x * x + y * y

        if (limit && l >= r * r) continue
        l = Math.sqrt(l)

        if (mediaEnabled) {
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
            cell.targetMediaVersion = Math.max(cell.targetMediaVersion, 1)
          }
        }

        if (l === 0) continue
        l = (r - l) / l
        // l = ((r - l) / l) * alpha

        const vCommon = l * (pushStrength * pushStrengthScaling) * diagonalMod

        if (i !== centerCell.index) {
          cell.vx += x * vCommon * pushXFactor * pointerFollowModX

          if (!pushSkipYOnCenterCellRow || cell.row !== centerCell.row) {
            cell.vy += y * vCommon * pushYFactor * pointerFollowModY
          }
        }
      }

      if (latticeEnabled) {
        if (
          colLevelAdjacency <= latticeMaxLevelsFromCenter ||
          rowLevelAdjacency < latticeMaxLevelsFromCenter
        ) {
          const source = cell
          const ii = i - 1
          if (ii > 0) {
            const target = cells[ii]

            if (target) {
              let x = target.x + target.vx - source.x - source.vx
              let y = target.y + target.vy - source.y - source.vy
              let l = Math.sqrt(x * x + y * y)
              l =
                ((l - globalConfig.lattice.cellWidth) / l) *
                alpha *
                latticeStrength
              x *= l * latticeXFactor * 0.5
              y *= l * latticeYFactor * 0.5

              target.vx -= x
              target.vy -= y
              source.vx += x
              source.vy += y
            }
          }
        }

        if (
          colLevelAdjacency <= latticeMaxLevelsFromCenter ||
          rowLevelAdjacency < latticeMaxLevelsFromCenter
        ) {
          const source = cell
          const ii = i - globalConfig.lattice.cols
          if (ii > 0) {
            const target = cells[ii]

            if (target) {
              let x = target.x + target.vx - source.x - source.vx
              let y = target.y + target.vy - source.y - source.vy
              let l = Math.sqrt(x * x + y * y)
              l =
                ((l - globalConfig.lattice.cellHeight) / l) *
                alpha *
                latticeStrength
              x *= l * latticeXFactor * 0.5
              y *= l * latticeYFactor * 0.5

              target.vx -= x
              target.vy -= y
              source.vx += x
              source.vy += y
            }
          }
        }
      }
    }
  }

  return force
}
