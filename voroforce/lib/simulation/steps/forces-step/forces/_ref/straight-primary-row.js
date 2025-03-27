import { lerp } from '../../../../../utils'

export const straightPrimaryRowForce = ({
  cells,
  dimensions,
  pointer,
  config: { strength = 1, strengthScaling = 0.1, selector = 'focused' },
  globalConfig,
}) => {
  const select = (cells) => cells[selector]
  console.log('aa')

  let centerCell,
    currentCenterCell,
    centerY,
    i,
    cell,
    y,
    l,
    startIndex,
    strengthMod = 0

  const h = dimensions.get('height')
  const rows = globalConfig.lattice.rows
  const cols = globalConfig.lattice.cols

  function force(alpha) {
    centerCell = select(cells)

    if (!centerCell) {
      return
    }

    if (centerCell.index !== currentCenterCell?.index) {
      strengthMod = 0
      currentCenterCell = centerCell
    }

    strengthMod = lerp(strengthMod, 1, Math.min(0.05, strengthMod + 0.001))

    centerY = centerCell.y + centerCell.vy

    startIndex = centerCell.row * cols
    for (i = startIndex; i < startIndex + cols; ++i) {
      if (i === centerCell.index) {
        continue
      }

      cell = cells[i]

      y = cell.y + cell.vy - centerY

      l = y

      if (l === 0) continue
      l = (h - l) / l

      // console.log('l', l)
      cell.vy -= y * (strength * strengthScaling) * strengthMod
      // console.log('cell.vy', cell.vy)
    }
  }

  return force
}
