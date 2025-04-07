import { lerp } from '../../utils/math'
import inertia from './inertia'

export const isGhostCell = (cell) => cell.group === -1
export const isInteractiveCell = (cell) => !isGhostCell(cell)

export const setCellTargetPin = (cell, position) => {
  cell.targetFx = position[0]
  cell.targetFy = position[1]
}
export const cellHasTargetPin = (cell) =>
  Number.isFinite(cell.targetFx) && Number.isFinite(cell.targetFy)
export const lerpToCellTargetPin = (cell, t) => {
  cell.fx = lerp(cell.x, cell.targetFx, t)
  cell.fy = lerp(cell.y, cell.targetFy, t)

  if (cell.inertia) {
    cell.inertia.move([cell.fx, cell.fy])
  }
}

export const pinCell = (cell) => {
  cell.fx = cell.x
  cell.fy = cell.y
  cell.targetFx = cell.x
  cell.targetFy = cell.y
}

export const unpinCell = (cell) => {
  // if (cell.fx !== undefined) {
  //   cell.x = cell.fx
  // }
  // if (cell.fy !== undefined) {
  //   cell.y = cell.fy
  // }

  cell.fx = undefined
  cell.fy = undefined
  cell.targetFx = undefined
  cell.targetFy = undefined
}

export const grabCell = (cell) => {
  cell.fx = cell.x
  cell.fy = cell.y

  console.log('grab cell')

  initCellTargetPinInertia(cell)
}

export const releaseCell = (cell) => {
  unpinCell(cell)

  console.log('release cell')

  if (cell.inertia) {
    cell.inertia.end()
  }
}

export const cellHasInertia = (cell) => cell.inertia?.active
export const updateCellInertia = (cell) => cell.inertia.update()

export const initCellTargetPinInertia = (cell) => {
  if (!cell.inertia) {
    cell.inertia = inertia({
      update: (t) => {
        // cell.fx = cell.inertia.position[0] + t * (1 - t) * cell.inertia.velocity[0]
        cell.fx =
          cell.inertia.position[0] + 0.25 * t ** 2 * cell.inertia.velocity[0]
        cell.fy =
          cell.inertia.position[1] + 0.25 * t ** 2 * cell.inertia.velocity[1]
      },
      stop: () => {
        unpinCell(cell)
      },
    })
  }
  cell.inertia.start([cell.x, cell.y])
}

export const handleCellPins = (cell) => {
  if (cellHasTargetPin(cell)) {
    lerpToCellTargetPin(cell, cell.isDragging ? 0.15 : 0.15)
  } else if (cellHasInertia(cell)) {
    updateCellInertia(cell)
  }
}
