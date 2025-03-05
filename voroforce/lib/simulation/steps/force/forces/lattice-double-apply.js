export const latticeForce = ({
  cells,
  links = [],
  config: {
    selector = 'focused',
    strength,
    distance: d,
    xFactor = 1,
    yFactor = 1,
    maxLevelsFromCenter = 4,
  },
  globalConfig,
}) => {
  const select = (cells) => cells[selector]

  const distance = ({ type }) =>
    d ??
    (type === 'x'
      ? globalConfig.lattice.cellWidth
      : globalConfig.lattice.cellHeight) ??
    30
  let distances

  let centerCell,
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
    colLevelAdjacency,
    rowLevelAdjacency

  function force(alpha) {
    centerCell = select(cells)

    if (!centerCell) {
      return
    }

    for (let i = 0, n = links.length; i < n; ++i) {
      apply(i, alpha)
      apply(n - 1 - i, alpha)
    }
  }

  function apply(i, alpha) {
    const link = links[i]
    const source = link.source
    const target = link.target

    colLevelAdjacency = Math.abs(source.col - centerCell.col)
    rowLevelAdjacency = Math.abs(source.row - centerCell.row)

    if (
      colLevelAdjacency < maxLevelsFromCenter &&
      rowLevelAdjacency < maxLevelsFromCenter
    ) {
      const maxLevelAdjacency = Math.max(colLevelAdjacency, rowLevelAdjacency)
      const strengthMod =
        (maxLevelsFromCenter - maxLevelAdjacency) / maxLevelsFromCenter
      // const strengthMod =
      //   link.type === 'x'
      //     ? (maxLevelsFromCenter - colLevelAdjacency) / maxLevelsFromCenter
      //     : (maxLevelsFromCenter - rowLevelAdjacency) / maxLevelsFromCenter

      x = target.x + target.vx - source.x - source.vx
      y = target.y + target.vy - source.y - source.vy
      l = Math.sqrt(x * x + y * y)
      l = ((l - distances[i]) / l) * alpha * strength * strengthMod
      x *= l * xFactor * 0.5
      y *= l * yFactor * 0.5

      target.vx -= x
      target.vy -= y
      source.vx += x
      source.vy += y
    }
  }

  function initialize() {
    if (!cells) return

    const m = links.length
    distances = new Array(m)
    initializeDistance()
  }

  function initializeDistance() {
    if (!cells) return

    for (let i = 0, n = links.length; i < n; ++i) {
      distances[i] = +distance(links[i], i, links)
    }
  }

  force.initialize = (_cells) => {
    cells = _cells
    initialize()
  }

  return force
}
