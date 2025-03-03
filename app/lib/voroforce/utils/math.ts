export enum MIN_LERP_EASING_TYPES {
  linear = 'linear',
  easeInQuad = 'easeInQuad',
  easeOutQuad = 'easeOutQuad',
  easeInOutQuad = 'easeInOutQuad',
  easeInCubic = 'easeInCubic',
  easeOutCubic = 'easeOutCubic',
  easeInOutCubic = 'easeInOutCubic',
  easeInExpo = 'easeInExpo',
  easeOutExpo = 'easeOutExpo',
  easeInOutExpo = 'easeInOutExpo',
  elastic = 'elastic',
  bounce = 'bounce',
}

export const easedMinLerp = (
  start: number,
  end: number,
  factor: number,
  easingType: MIN_LERP_EASING_TYPES = MIN_LERP_EASING_TYPES.linear,
  min = 0.01,
) => {
  // Calculate the raw difference
  const diff = end - start

  if (Math.abs(diff) < min) {
    return end
  }

  // Apply easing to the factor based on the selected type
  let easedFactor: number

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
