const conditionalReturn = (value, func) =>
  value || value === 0 ? func(value) : func

export const mapRange = (inMin, inMax, outMin, outMax, value) => {
  const inRange = inMax - inMin
  const outRange = outMax - outMin
  return conditionalReturn(
    value,
    (value) => outMin + (((value - inMin) / inRange) * outRange || 0),
  )
}

export const clamp = (min, max, value) =>
  conditionalReturn(value, (v) =>
    value < min ? min : value > max ? max : value,
  )

export const lerp = (v0, v1, t) => {
  return v0 * (1 - t) + v1 * t
}

export const minLerp = (start, end, factor, min = 0.001) => {
  const diff = end - start
  if (Math.abs(diff) < min) return end
  return start + diff * factor
}

export const MIN_LERP_EASING_TYPES = {
  linear: 'linear',
  easeInQuad: 'easeInQuad',
  easeOutQuad: 'easeOutQuad',
  easeInOutQuad: 'easeInOutQuad',
  easeInCubic: 'easeInCubic',
  easeOutCubic: 'easeOutCubic',
  easeInOutCubic: 'easeInOutCubic',
  easeInExpo: 'easeInExpo',
  easeOutExpo: 'easeOutExpo',
  easeInOutExpo: 'easeInOutExpo',
  elastic: 'elastic',
  bounce: 'bounce',
}

export const easedMinLerp = (
  start,
  end,
  factor,
  easingType = MIN_LERP_EASING_TYPES.linear,
  min = 0.001,
) => {
  // Calculate the raw difference
  const diff = end - start

  if (Math.abs(diff) < min) {
    return end
  }

  // Apply easing to the factor based on the selected type
  let easedFactor

  switch (easingType) {
    case 'linear':
      easedFactor = factor
      break

    case 'easeInQuad':
      // Quadratic ease in: accelerating from zero velocity
      easedFactor = factor * factor
      break

    case 'easeOutQuad':
      // Quadratic ease out: decelerating to zero velocity
      easedFactor = factor * (2 - factor)
      break

    case 'easeInOutQuad':
      // Quadratic ease in/out: acceleration until halfway, then deceleration
      easedFactor =
        factor < 0.5 ? 2 * factor * factor : -1 + (4 - 2 * factor) * factor
      break

    case 'easeInCubic':
      // Cubic ease in: accelerating from zero velocity
      easedFactor = factor * factor * factor
      break

    case 'easeOutCubic':
      // Cubic ease out: decelerating to zero velocity
      easedFactor = (factor - 1) * factor * factor + 1
      break

    case 'easeInOutCubic':
      // Cubic ease in/out: acceleration until halfway, then deceleration
      easedFactor =
        factor < 0.5
          ? 4 * factor * factor * factor
          : (factor - 1) * (2 * factor - 2) * (2 * factor - 2) + 1
      break

    case 'easeInExpo':
      // Exponential ease in: accelerating from zero velocity
      easedFactor = factor === 0 ? 0 : 2 ** (10 * (factor - 1))
      break

    case 'easeOutExpo':
      // Exponential ease out: decelerating to zero velocity
      easedFactor = factor === 1 ? 1 : 1 - 2 ** (-10 * factor)
      break

    case 'easeInOutExpo':
      // Exponential ease in/out: acceleration until halfway, then deceleration
      if (factor === 0) easedFactor = 0
      if (factor === 1) easedFactor = 1
      if (factor < 0.5) {
        easedFactor = 0.5 * 2 ** (10 * (2 * factor - 1))
      } else {
        easedFactor = 0.5 * (-(2 ** (-10 * (2 * factor - 1))) + 2)
      }
      break

    case 'elastic': {
      // Elastic bounce effect
      const p = 0.3
      easedFactor =
        2 ** (-10 * factor) * Math.sin(((factor - p / 4) * (2 * Math.PI)) / p) +
        1
      break
    }
    case 'bounce':
      // Bouncing effect
      if (factor < 1 / 2.75) {
        easedFactor = 7.5625 * factor * factor
      } else if (factor < 2 / 2.75) {
        easedFactor = factor - 1.5 / 2.75
        easedFactor = 7.5625 * easedFactor * easedFactor + 0.75
      } else if (factor < 2.5 / 2.75) {
        easedFactor = factor - 2.25 / 2.75
        easedFactor = 7.5625 * easedFactor * easedFactor + 0.9375
      } else {
        easedFactor = factor - 2.625 / 2.75
        easedFactor = 7.5625 * easedFactor * easedFactor + 0.984375
      }
      break

    default:
      easedFactor = factor
  }

  // Apply the eased factor to the difference
  return start + diff * easedFactor
}

/**
 *
 * This function performs Hermite interpolation between 0 and 1 when x is between edge0 and edge1.
 *
 * Computes a smooth Hermite interpolation between 0 and 1 when given
 * a value `x` between two edge values `edge0` and `edge1`.
 *
 * The function clamps `x` to the range [0, 1] and then applies the
 * smoothstep formula: 3*x² - 2*x³, which produces a gradual, smooth
 * transition.
 *
 * The result is 0 when x ≤ edge0 and 1 when x ≥ edge1.
 *
 * @param {number} edge0 - The lower edge of the interpolation range.
 * @param {number} edge1 - The upper edge of the interpolation range.
 * @param {number} x - The input value to interpolate, expected within the range [edge0, edge1].
 * @returns {number} A number between 0 and 1 representing the interpolated value.
 */
export const smoothstep = (edge0, edge1, x) => {
  // Clamp x to the range [0, 1]
  const y = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))

  // Apply the smoothstep formula: 3x² - 2x³
  return y * y * (3 - 2 * y)
}
