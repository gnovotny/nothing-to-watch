import { isNumber, lerp } from '../../../../../utils'

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
      requestMediaVersions: pushRequestMediaVersions = true,
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
    cellTypePushModX = 1,
    cellTypePushModY = 1,
    centerCellPushFactor = 0,
    centerCellPushFactorX = 0,
    centerCellPushFactorY = 0,
    closestPointerPositionCenterCellNeighbor,
    closestPointerPositionCenterCellNeighborX,
    closestPointerPositionCenterCellNeighborY,
    closestPointerPositionCenterCellNeighborPushFactor = 1,
    closestPointerPositionCenterCellNeighborPushFactorX = 1,
    closestPointerPositionCenterCellNeighborPushFactorY = 1,
    addX = 0,
    addY = 0

  const mediaEnabled = globalConfig.media.enabled && pushRequestMediaVersions

  if (mediaEnabled) {
    const diagonal = dimensions.get('diagonal')
    mediaV1DistThreshold = diagonal * 0.075
    mediaV2DistThreshold = diagonal * 0.025
    mediaV1LevelAdjacencyThreshold = 18
    mediaV2LevelAdjacencyThreshold = 6
  }

  function applyLatticeLink(cell, target, alpha, size, strengthMod) {
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

  // lattice loop must run separately, without interference from other forces
  function lattice(alpha) {
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

          colLevelAdjacency = abs(cell.col - centerCell.col)
          rowLevelAdjacency = abs(cell.row - centerCell.row)
          maxLevelAdjacency = max(colLevelAdjacency, rowLevelAdjacency)
          latticeStrengthMod =
            (latticeMaxLevelsFromCenter - maxLevelAdjacency) /
            latticeMaxLevelsFromCenter

          // left
          applyLatticeLink(
            cell,
            cells[i - 1],
            alpha,
            latticeCellWidth,
            latticeStrengthMod,
          )

          // top
          applyLatticeLink(
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

  function pushSetup(alpha) {
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

    centerX = isNumber(centerX) ? centerX : targetCenterX
    centerY = isNumber(centerY) ? centerY : targetCenterY
    centerX = lerp(
      centerX,
      targetCenterX,
      min(1, abs(targetCenterX - centerX) / 10),
      // pointer.speedScale,
    )

    centerY = lerp(
      centerY,
      targetCenterY,
      min(1, abs(targetCenterY - centerY) / 10),
      // pointer.speedScale,
    )

    // console.log('pointer.speedScale', pointer.speedScale)

    // console.log(
    //   '(1 - pointer.speedScale) * 0.1',
    //   (1 - pointer.speedScale) * 0.1,
    // )
    // centerCell.x = centerCellX = lerp(
    //   centerCellX,
    //   pointer.x,
    //   // min(1, abs(centerX - centerCellX) / 150),
    //   // (1 - pointer.speedScale) * 0.1,
    //   0.15,
    // )
    //
    // centerCell.y = centerCellY = lerp(
    //   centerCellY,
    //   pointer.y,
    //   // min(1, abs(centerY - centerCellY) / 150),
    //   // (1 - pointer.speedScale) * 0.1,
    //   0.15,
    // )

    // cell.vx += (cell.ix - cell.x) * originStrength * alpha * originXFactor

    closestPointerPositionCenterCellNeighbor =
      cells[centerCell.closestIndices[0]]

    if (closestPointerPositionCenterCellNeighbor) {
      closestPointerPositionCenterCellNeighborX =
        closestPointerPositionCenterCellNeighbor.x +
        closestPointerPositionCenterCellNeighbor.vx
      closestPointerPositionCenterCellNeighborY =
        closestPointerPositionCenterCellNeighbor.y +
        closestPointerPositionCenterCellNeighbor.vy

      x = centerX - centerCellX
      y = centerY - centerCellY
      const centerToCenterCellDist = sqrt(x * x + y * y)

      x = centerX - closestPointerPositionCenterCellNeighborX
      y = centerY - closestPointerPositionCenterCellNeighborY
      const centerToCenterCellNeighborDist = sqrt(x * x + y * y)

      const distRatio = centerToCenterCellDist / centerToCenterCellNeighborDist

      const inverseDistRatio = 1 - distRatio

      // addX = -(centerX - centerCell.x) * inverseDistRatio * alpha
      // addY = -(centerY - centerCell.y) * inverseDistRatio * alpha

      // if (inverseDistRatio > 0.5) {
      addX = lerp(addX, (centerX - centerCell.x) * inverseDistRatio * alpha, 1)

      addY = lerp(addY, (centerY - centerCell.y) * inverseDistRatio * alpha, 1)
      // } else {
      //   addX = 0
      //   addY = 0
      // }

      // centerCell.vx += addX
      // centerCell.vy += addY

      // console.log('addX', addX)
      // console.log('inverseDistRatio', inverseDistRatio)

      // console.log('distRatio', distRatio)
      centerCellPushFactor = Math.min(distRatio, 1)
      centerCellPushFactorX = centerCellPushFactor
      centerCellPushFactorY = centerCellPushFactor
      // centerCellPushFactorX = centerCellPushFactor / pushXFactor
      // centerCellPushFactorY = centerCellPushFactor / pushYFactor

      closestPointerPositionCenterCellNeighborPushFactor =
        1 - centerCellPushFactor
      closestPointerPositionCenterCellNeighborPushFactorX =
        closestPointerPositionCenterCellNeighborPushFactor
      closestPointerPositionCenterCellNeighborPushFactorY =
        1 - centerCellPushFactor

      const inverseCenterCellPushFactor = 1 - centerCellPushFactor
      // console.log('inverseCenterCellPushFactor', inverseCenterCellPushFactor)
      const diffX = centerX - centerCell.x
      const diffY = centerY - centerCell.y
      const inverseDiffX = 1 / diffX
      const inverseDiffY = 1 / diffY
      // centerCell.vx += diffX * alpha * 0.8
      // centerCell.vy += (centerY - centerCell.y) * alpha * 0.8
      // centerCell.vx += diffX * alpha * (1 - pointer.speedScale)
      // centerCell.vy += (centerY - centerCell.y) * alpha * (1 - pointer.speedScale)

      const centerCellXAddition =
        inverseDiffX *
        inverseCenterCellPushFactor /* * alpha*/ *
        (1 - pointer.speedScale)
      const centerCellYAddition =
        inverseDiffY *
        inverseCenterCellPushFactor /* * alpha*/ *
        (1 - pointer.speedScale)

      // console.log('diffX', 1 / diffX)
      // console.log('centerCellXAddition', centerCellXAddition)
      // console.log('pointer.speedScale', pointer.speedScale)
      // console.log('inverseCenterCellPushFactor', inverseCenterCellPushFactor)
      // console.log('pointer.speedScale', pointer.speedScale)

      // centerCell.vx -=
      //   centerCellX -
      //   lerp(
      //     centerCellX,
      //     centerX,
      //     (1 - pointer.speedScale) *
      //       inverseCenterCellPushFactor *
      //       pushXFactor *
      //       alpha,
      //   )
      // centerCell.vy -=
      //   centerCellY -
      //   lerp(
      //     centerCellY,
      //     centerY,
      //     (1 - pointer.speedScale) *
      //       inverseCenterCellPushFactor *
      //       pushYFactor *
      //       alpha,
      //   )
      //
      // // centerCell.x += centerCellXAddition
      // // centerCell.y += centerCellYAddition
      // // centerCellX = centerCell.x
      // // centerCellY = centerCell.y
      // centerCellX = centerCell.x + centerCell.vx
      // centerCellY = centerCell.y + centerCell.vy

      // centerCellX =
      // console.log('centerCell.vx', centerCell.vx)

      // if (distRatio < 0.5) {
      //   centerCellPushFactorX = centerCellPushFactorY = centerCellPushFactor = 0
      //   closestPointerPositionCenterCellNeighborPushFactorX =
      //     closestPointerPositionCenterCellNeighborPushFactorY =
      //     closestPointerPositionCenterCellNeighborPushFactor =
      //       1
      // } else {
      //   distRatio -= 0.5
      //   centerCellPushFactor = Math.min(distRatio, 1)
      //   closestPointerPositionCenterCellNeighborPushFactor = Math.max(
      //     1 - centerCellPushFactor * 0.25,
      //     0.5,
      //   )
      //
      //   if (centerCell.col === closestPointerPositionCenterCellNeighbor.col) {
      //     centerCellPushFactorY = centerCellPushFactor
      //     closestPointerPositionCenterCellNeighborPushFactorY =
      //       closestPointerPositionCenterCellNeighborPushFactor
      //
      //     centerCellPushFactorX = 0
      //     closestPointerPositionCenterCellNeighborPushFactorX = 0
      //   } else if (
      //     centerCell.row === closestPointerPositionCenterCellNeighbor.row
      //   ) {
      //     centerCellPushFactorX = centerCellPushFactor
      //     closestPointerPositionCenterCellNeighborPushFactorX =
      //       closestPointerPositionCenterCellNeighborPushFactor
      //
      //     centerCellPushFactorY = 0
      //     closestPointerPositionCenterCellNeighborPushFactorY = 0
      //   } else {
      //     centerCellPushFactorX = centerCellPushFactorY = centerCellPushFactor
      //     closestPointerPositionCenterCellNeighborPushFactorX =
      //       closestPointerPositionCenterCellNeighborPushFactorY =
      //         closestPointerPositionCenterCellNeighborPushFactor
      //   }
      // }

      // console.log('centerCellPushFactor', centerCellPushFactor)
      // console.log(
      //   'closestPointerPositionCenterCellNeighborPushFactor',
      //   closestPointerPositionCenterCellNeighborPushFactor,
      // )

      // centerX = centerCellX
      // centerY = centerCellY
    } else {
      centerCellPushFactor = 0
      closestPointerPositionCenterCellNeighborPushFactor = 1
    }
  }

  function force(alpha) {
    if (cells.focused?.index !== centerCell?.index) {
      previousCenterCell = centerCell
      centerCell = cells.focused
    }

    if (centerCell) {
      pushSetup(alpha)
      lattice(alpha)
    }

    for (i = 0; i < cells.length; ++i) {
      cell = cells[i]

      cell.vx += (cell.ix - cell.x) * originStrength * alpha * originXFactor
      cell.vy += (cell.iy - cell.y) * originStrength * alpha * originYFactor

      if (centerCell) {
        // if (i !== centerCell.index) {
        cell.vx += addX
        cell.vy += addY
        // }
      }

      if (centerCell) {
        colLevelAdjacency = abs(cell.col - centerCell.col)
        rowLevelAdjacency = abs(cell.row - centerCell.row)
        maxLevelAdjacency = max(colLevelAdjacency, rowLevelAdjacency)

        x = cell.x + cell.vx - centerX
        y = cell.y + cell.vy - centerY
        l = sqrt(x * x + y * y)

        // media loading logic, might move it at some point
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

        x *= l
        y *= l

        const centerRow =
          pushCenterMagic &&
          cell.row === centerCell.row &&
          /*previousCenterCell?.row === centerCell.row ||*/
          closestPointerPositionCenterCellNeighbor?.row === centerCell.row
        const centerCol =
          pushCenterMagic &&
          cell.col === centerCell.col &&
          /*previousCenterCell?.col === centerCell.col ||*/
          closestPointerPositionCenterCellNeighbor?.col === centerCell.col
        const pushYMod = 1
        const pushXMod = 1

        // if (i !== centerCell.index) {
        //   if (centerCol && rowLevelAdjacency < 2) {
        //     // pushXMod = 1 - sqrt((20 - rowLevelAdjacency) / 20)
        //     x = (cell.x + cell.vx - centerCellX) * pushStrength
        //   }
        //   //
        //   if (centerRow && colLevelAdjacency < 2) {
        //     // pushYMod = 1 - sqrt((40 - colLevelAdjacency) / 40)
        //
        //     y = (cell.y + cell.vy - centerCellY) * pushStrength
        //
        //     // console.log('asdf', 1 / (colLevelAdjacency ?? 1))
        //
        //     // if (colLevelAdjacency < 2) {
        //     //   console.log('pushYMod', pushYMod)
        //     // }
        //   }
        // }

        // if (centerRow && colLevelAdjacency > 1 && colLevelAdjacency < 20) {
        //   pushXMod += ((20 - colLevelAdjacency) / 20) * 0.3
        // }

        // if (colLevelAdjacency < 2 && rowLevelAdjacency < 2) {
        //   pushXMod *= 1.2
        //   pushYMod *= 1.2
        // }

        cellTypePushModX = 1
        cellTypePushModY = 1
        if (i === centerCell.index) {
          cellTypePushModX = centerCellPushFactorX
          cellTypePushModY = centerCellPushFactorY
          // cellTypePushModX = 0
          // cellTypePushModY = 0
        }
        // if (i === closestPointerPositionCenterCellNeighbor?.index) {
        //   cellTypePushModX = closestPointerPositionCenterCellNeighborPushFactorX
        //   cellTypePushModY = closestPointerPositionCenterCellNeighborPushFactorY
        //
        //   // console.log('cellTypePushModY', cellTypePushModY)
        // }

        // if (
        //   i !== centerCell.index &&
        //   centerCell.col === closestPointerPositionCenterCellNeighbor?.col &&
        //   centerCell.col === cell.col &&
        //   rowLevelAdjacency < 10
        // ) {
        //   const dir =
        //     centerCell.row - closestPointerPositionCenterCellNeighbor.row
        //   if (
        //     dir > 0 &&
        //     cell.row < closestPointerPositionCenterCellNeighbor.row
        //   ) {
        //     cellTypePushModX = 1 - rowLevelAdjacency / 10
        //     console.log('cellTypePushModX', cellTypePushModX)
        //   } else if (
        //     dir < 0 &&
        //     cell.row > closestPointerPositionCenterCellNeighbor.row
        //   ) {
        //     cellTypePushModX = 1 - rowLevelAdjacency / 10
        //   }
        // }
        //
        // if (
        //   i !== centerCell.index &&
        //   centerCell.row === closestPointerPositionCenterCellNeighbor?.row &&
        //   centerCell.row === cell.row &&
        //   colLevelAdjacency < 10
        // ) {
        //   const dir =
        //     centerCell.col - closestPointerPositionCenterCellNeighbor.col
        //   if (
        //     dir > 0 &&
        //     cell.col < closestPointerPositionCenterCellNeighbor.col
        //   ) {
        //     cellTypePushModY = 1 - colLevelAdjacency / 10
        //   } else if (
        //     dir < 0 &&
        //     cell.col > closestPointerPositionCenterCellNeighbor.col
        //   ) {
        //     cellTypePushModY = 1 - colLevelAdjacency / 10
        //   }
        // }

        cell.vx += x * pushXFactor * pushXMod * cellTypePushModX
        cell.vy += y * pushYFactor * pushYMod * cellTypePushModY
      }

      handleEnd?.(cell)
    }
  }

  return force
}
