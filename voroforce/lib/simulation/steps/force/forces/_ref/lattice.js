export const latticeForce = ({
  cells,
  config: {
    selector = 'focused',
    strength,
    xFactor = 1,
    yFactor = 1,
    maxLevelsFromCenter = 10,
    maxRadius = 10,
  },
  globalConfig,
}) => {
  const select = (cells) => cells[selector]

  let centerCell,
    i,
    n = cells.length,
    cell,
    x,
    y,
    l,
    colLevelAdjacency,
    rowLevelAdjacency,
    maxLevelAdjacency,
    cols = globalConfig.lattice.cols,
    cellWidth = globalConfig.lattice.cellWidth,
    cellHeight = globalConfig.lattice.cellHeight,
    centerCellX,
    centerCellY,
    abs = Math.abs,
    max = Math.max

  function force(alpha) {
    centerCell = select(cells)
    if (!centerCell) return

    centerCellX = centerCell.x + centerCell.vx
    centerCellY = centerCell.y + centerCell.vy
    for (i = 0; i < n; ++i) {
      apply(i, alpha)
    }
  }

  function apply(i, alpha) {
    cell = cells[i]

    // x = cell.x + cell.vx - centerCellX
    // y = cell.y + cell.vy - centerCellY
    // l = x * x + y * y
    // if (l === 0) return
    // l = Math.sqrt(l)
    // if (l < maxRadius) {
    //   appliedCount++
    //   let sMod = (maxRadius - l) / l
    //   sMod = Math.min(sMod, 1)
    //   if (cell.col > 0) {
    //     applyComponent(cell, cells[i - 1], alpha, cellWidth, sMod)
    //   }
    //
    //   if (cell.row > 0) {
    //     applyComponent(cell, cells[i - cols], alpha, cellHeight, sMod)
    //   }
    // }

    colLevelAdjacency = abs(cell.col - centerCell.col)
    rowLevelAdjacency = abs(cell.row - centerCell.row)
    maxLevelAdjacency = max(colLevelAdjacency, rowLevelAdjacency)
    if (maxLevelAdjacency < maxLevelsFromCenter) {
      if (cell.col > 0 && colLevelAdjacency < maxLevelsFromCenter) {
        applyComponent(
          cell,
          cells[i - 1],
          alpha,
          cellWidth,
          (maxLevelsFromCenter - maxLevelAdjacency) / maxLevelsFromCenter,
        )
      }

      if (cell.row > 0 && rowLevelAdjacency < maxLevelsFromCenter) {
        applyComponent(
          cell,
          cells[i - cols],
          alpha,
          cellHeight,
          (maxLevelsFromCenter - maxLevelAdjacency) / maxLevelsFromCenter,
        )
      }
    }
  }

  function applyComponent(cell, target, alpha, size, strengthMod) {
    x = target.x + target.initialVx - cell.x - cell.initialVx
    y = target.y + target.initialVy - cell.y - cell.initialVy

    l = Math.sqrt(x * x + y * y)
    l = ((l - size) / l) * alpha * strength * strengthMod * 0.5
    x *= l * xFactor
    y *= l * yFactor

    target.vx -= x
    target.vy -= y
    cell.vx += x
    cell.vy += y
  }

  return force
}
