export const originForce = ({
  cells,
  config: { strength = 0.1, xFactor = 1, yFactor = 1 },
  handleEnd,
}) => {
  function force(alpha) {
    for (let i = 0, n = cells.length, cell; i < n; ++i) {
      cell = cells[i]
      cell.vx += (cell.ix - cell.x) * strength * alpha * xFactor
      cell.vy += (cell.iy - cell.y) * strength * alpha * yFactor

      handleEnd?.(cell)
    }
  }

  return force
}
