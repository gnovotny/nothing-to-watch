import { isNumber, lerp, mapRange } from '../../../../utils'

export const pushForce = ({
  cells,
  dimensions,
  pointer,
  config: {
    strength = 1,
    strengthScaling = 0.1,
    selector = 'focused',
    pointerFollow = {
      enabled: false,
      scaling: 0.25,
      y: true,
      x: true,
    },
    pointerFollowAlt = {
      enabled: false,
      scaling: 0.25,
      y: true,
      x: true,
    },
    radius = () => dimensions.get('diagonal'),
    radiusScaling = 1,
    xFactor = 1,
    yFactor = 1,
    diagonalFactor = 1,
    manageMediaVersions = true,
    centerMagic = false,
    handleEnd,
  },
  globalConfig,
}) => {
  const select = (cells) => cells[selector]

  let centerCell,
    previousCenterCell,
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
    l

  const mediaEnabled = globalConfig.media.enabled && manageMediaVersions

  function force(alpha) {
    if (select(cells)?.index !== centerCell?.index) {
      previousCenterCell = centerCell
      centerCell = select(cells)
    }

    if (!centerCell) {
      // centerX = undefined
      // centerY = undefined
      // targetCenterX = undefined
      // targetCenterY = undefined
      return
    }

    if (mediaEnabled) {
      centerCell.targetMediaVersion = 2
    }

    const limit = false

    r = +radius(centerCell, centerCell.index, cells) * radiusScaling

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
      pointerFollow.enabled && pointerFollow.scaling && hasPointer

    if (pointerFollowActive) {
      if (pointerFollow.x)
        centerX = lerp(centerX, pointer.x, pointerFollow.scaling)
      if (pointerFollow.y)
        centerY = lerp(centerY, pointer.y, pointerFollow.scaling)
    }

    const pointerFollowAltActive =
      pointerFollowAlt.enabled && pointerFollowAlt.scaling && hasPointer

    if (pointerFollowAltActive) {
      if (pointerFollowAlt.x)
        centerX = lerp(centerX, pointer.x, pointerFollowAlt.scaling)
      if (pointerFollowAlt.y)
        centerY = lerp(centerY, pointer.y, pointerFollowAlt.scaling)
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
    centerX = centerCellX
    centerY = centerCellY

    let pointerFollowModX = 1
    let pointerFollowModY = 1

    for (i = 0; i < cells.length; ++i) {
      pointerFollowModX = 1
      pointerFollowModY = 1
      if (i === centerCell.index) {
        continue
      }
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

      cell = cells[i]

      x = cell.x + cell.vx - centerX
      y = cell.y + cell.vy - centerY

      let diagonalMod = 1
      if (diagonalFactor !== 1) {
        const absX = Math.abs(x)
        const absY = Math.abs(y)

        diagonalMod = mapRange(
          0,
          1,
          1,
          diagonalFactor,
          Math.min(absX, absY) / Math.max(absX, absY),
        )
      }

      l = x * x + y * y

      if (limit && l >= r * r) continue
      l = Math.sqrt(l)

      if (mediaEnabled) {
        if (l < 150) {
          cell.targetMediaVersion = cell.mediaVersion === 0 ? 1 : 2
        } else if (l < 200) {
          cell.targetMediaVersion = Math.max(cell.targetMediaVersion, 1)
        }
      }

      if (l === 0) continue
      l = (r - l) / l
      // l = ((r - l) / l) * alpha

      const vCommon = l * (strength * strengthScaling) * diagonalMod

      cell.vx += x * vCommon * xFactor * pointerFollowModX

      if (
        centerMagic &&
        cell.row === centerCell.row &&
        previousCenterCell?.row === centerCell.row
      )
        continue
      cell.vy += y * vCommon * yFactor * pointerFollowModY
    }
  }

  return force
}
