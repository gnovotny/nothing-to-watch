import { isNumber } from '../../../../../utils'

export const moveCenterToPointForce = ({
  cells,
  dimensions,
  pointer,
  config: {
    strength = 1,
    strengthScaling = 1,
    selector = 'focused',
    point = { x: undefined, y: undefined },
  },
  globalConfig,
}) => {
  const select = (cells) => cells[selector]
  let centerCell,
    centerY,
    centerX,
    i,
    cell,
    x,
    y,
    strengthMod = 1,
    commonMod

  function force(alpha) {
    centerCell = select(cells)

    if (!centerCell || !isNumber(point.x) || !isNumber(point.y)) {
      return
    }

    // console.log('yes')

    centerY = centerCell.y + centerCell.vy
    centerX = centerCell.x + centerCell.vx

    y = point.y - centerY
    x = point.x - centerX

    commonMod = /*alpha * */ strength * strengthScaling * strengthMod

    // console.log('width', dimensions.get('width'))
    // console.log('height', dimensions.get('height'))
    // console.log('point', point)
    // console.log('centerY', centerY)
    // console.log('centerX', centerX)
    // console.log('x', x)
    // console.log('y', y)
    // console.log('commonMod', commonMod)
    // throw new Error()

    for (i = 0; i < cells.length; ++i) {
      cell = cells[i]

      cell.vy += y * commonMod
      cell.vx += x * commonMod
    }
  }

  return force
}
