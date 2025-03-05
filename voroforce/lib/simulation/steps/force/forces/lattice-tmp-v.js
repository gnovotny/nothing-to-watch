import { isNumber } from '../../../../utils'
import constant from './utils/constant'

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
    reverse = false,
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
    random,
    initialVelocities = new Map()

  function defaultStrength(link) {
    return 1 / Math.min(count[link.source.index], count[link.target.index])
  }

  function force(alpha) {
    const centerCell = cells.focused
    for (let k = 0, n = links.length; k < iterations; ++k) {
      for (let i = 0, link, source, target, x, y, l, b; i < n; ++i) {
        // const ii = n - 1 - i
        const ii = reverse ? n - 1 - i : i
        link = links[ii]
        source = link.source
        target = link.target

        // TODO NOT USING CURRENT VELOCITIES HAVE ANY DOWNSIDES?
        x =
          target.x +
          (isNumber(target.initialVx) ? target.initialVx : target.vx) -
          source.x -
          (isNumber(source.initialVx)
            ? source.initialVx
            : source.vx) /* || jiggle(random)*/
        y =
          target.y +
          (isNumber(target.initialVy) ? target.initialVy : target.vy) -
          source.y -
          (isNumber(source.initialVy)
            ? source.initialVy
            : source.vy) /* || jiggle(random)*/
        // x = target.x - source.x /* || jiggle(random)*/
        // y = target.y - source.y /* || jiggle(random)*/
        l = Math.sqrt(x * x + y * y)
        l = ((l - distances[ii]) / l) * alpha * strengths[ii]
        x *= l * xFactor * 0.5
        y *= l * yFactor * 0.5

        target.vx -= x
        target.vy -= y
        source.initialVx = source.vx
        source.initialVy = source.vy
        source.vx += x
        source.vy += y
      }
    }
    // reverse = !reverse
  }

  function initialize() {
    if (!cells) return

    //
    // let i,
    //   n = cells.length,
    //   m = links.length,
    //   cellById = new Map(cells.map((d, i) => [id(d, i, cells), d])),
    //   link

    // for (i = 0, count = new Array(n); i < m; ++i) {
    //   link = links[i]
    //   link.index = i
    //   if (typeof link.source !== 'object')
    //     link.source = find(cellById, link.source)
    //   if (typeof link.target !== 'object')
    //     link.target = find(cellById, link.target)
    //   count[link.source.index] = (count[link.source.index] || 0) + 1
    //   count[link.target.index] = (count[link.target.index] || 0) + 1
    // }
    //
    // for (i = 0, bias = new Array(m); i < m; ++i) {
    //   link = links[i]
    //   bias[i] =
    //     count[link.source.index] /
    //     (count[link.source.index] + count[link.target.index])
    // }

    const m = links.length
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
