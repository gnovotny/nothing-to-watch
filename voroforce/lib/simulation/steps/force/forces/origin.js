import constant from './utils/constant'

export const originForce = ({
  cells,
  config: { strength = 0.1, center = false, xFactor = 1, yFactor = 1 },
  globalConfig,
  dimensions,
  handleEnd,
}) => {
  let originX = (cell) => cell.ix
  let originY = (cell) => cell.iy

  if (center) {
    originX = constant(dimensions.width / 2)
    originY = constant(dimensions.height / 2)
  }

  function force(alpha) {
    for (let i = 0, n = cells.length, cell; i < n; ++i) {
      cell = cells[i]
      cell.vx += (originX(cell) - cell.x) * strength * alpha * xFactor
      cell.vy += (originY(cell) - cell.y) * strength * alpha * yFactor

      handleEnd?.(cell)
    }
  }

  return force
}
