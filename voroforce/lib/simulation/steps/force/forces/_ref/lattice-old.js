import constant from '../utils/constant'
import jiggle from '../utils/jiggle'

function index(d) {
  return d.index
}

function find(cellById, cellId) {
  const cell = cellById.get(cellId)
  if (!cell) {
    throw new Error(`linkForce: Not found: ${cellId}`)
  }
  return cell
}

export const latticeForce = ({
  cells,
  links = [],
  config: {
    id = index,
    iterations = 1,
    strength: s,
    distance: d,
    xFactor = 1,
    yFactor = 1,
  },
  globalConfig,
}) => {
  let strength = s ? constant(s) : defaultStrength,
    strengths,
    // distance = constant(d ?? globalConfig.lattice.size ?? 30),
    distance = ({ type }) =>
      d ??
      (type === 'x'
        ? globalConfig.lattice.cellWidth
        : globalConfig.lattice.cellHeight) ??
      30,
    distances,
    count,
    bias,
    random

  function defaultStrength(link) {
    return 1 / Math.min(count[link.source.index], count[link.target.index])
  }

  function force(alpha) {
    for (let k = 0, n = links.length; k < iterations; ++k) {
      for (let i = 0, link, source, target, x, y, l, b; i < n; ++i) {
        link = links[i]
        source = link.source
        target = link.target
        x = target.x + target.vx - source.x - source.vx || jiggle(random)
        y = target.y + target.vy - source.y - source.vy || jiggle(random)
        l = Math.sqrt(x * x + y * y)
        l = ((l - distances[i]) / l) * alpha * strengths[i]
        x *= l
        y *= l
        // biome-ignore lint/suspicious/noAssignInExpressions: annoying
        target.vx -= x * (b = bias[i]) * xFactor
        target.vy -= y * b * yFactor
        // biome-ignore lint/suspicious/noAssignInExpressions: annoying
        source.vx += x * (b = 1 - b) * xFactor
        source.vy += y * b * yFactor
      }
    }
  }

  function initialize() {
    if (!cells) return

    let i,
      n = cells.length,
      m = links.length,
      cellById = new Map(cells.map((d, i) => [id(d, i, cells), d])),
      link

    for (i = 0, count = new Array(n); i < m; ++i) {
      link = links[i]
      link.index = i
      if (typeof link.source !== 'object')
        link.source = find(cellById, link.source)
      if (typeof link.target !== 'object')
        link.target = find(cellById, link.target)
      count[link.source.index] = (count[link.source.index] || 0) + 1
      count[link.target.index] = (count[link.target.index] || 0) + 1
    }

    for (i = 0, bias = new Array(m); i < m; ++i) {
      link = links[i]
      bias[i] =
        count[link.source.index] /
        (count[link.source.index] + count[link.target.index])
    }
    strengths = new Array(m)
    initializeStrength()
    distances = new Array(m)
    initializeDistance()
  }

  function initializeStrength() {
    if (!cells) return

    for (let i = 0, n = links.length; i < n; ++i) {
      strengths[i] = +strength(links[i], i, links)
    }
  }

  function initializeDistance() {
    if (!cells) return

    for (let i = 0, n = links.length; i < n; ++i) {
      distances[i] = +distance(links[i], i, links)
    }
  }

  force.initialize = (_cells, _random) => {
    cells = _cells
    random = _random
    initialize()
  }

  force.links = (_) =>
    // biome-ignore lint/suspicious/noAssignInExpressions: annoying
    // biome-ignore lint/style/noCommaOperator: annoying
    typeof _ !== 'undefined' ? ((links = _), initialize(), force) : links

  // biome-ignore lint/suspicious/noAssignInExpressions: annoying
  // biome-ignore lint/style/noCommaOperator: annoying
  force.id = (_) => (typeof _ !== 'undefined' ? ((id = _), force) : id)

  force.iterations = (_) =>
    // biome-ignore lint/suspicious/noAssignInExpressions: annoying
    // biome-ignore lint/style/noCommaOperator: annoying
    typeof _ !== 'undefined' ? ((iterations = +_), force) : iterations

  force.strength = (_) =>
    typeof _ !== 'undefined'
      ? // biome-ignore lint/suspicious/noAssignInExpressions: annoying
        ((strength = typeof _ === 'function' ? _ : constant(+_)),
        // biome-ignore lint/style/noCommaOperator: annoying
        initializeStrength(),
        force)
      : strength

  force.distance = (_) =>
    typeof _ !== 'undefined'
      ? // biome-ignore lint/suspicious/noAssignInExpressions: annoying
        ((distance = typeof _ === 'function' ? _ : constant(+_)),
        // biome-ignore lint/style/noCommaOperator: annoying
        initializeDistance(),
        force)
      : distance

  return force
}
