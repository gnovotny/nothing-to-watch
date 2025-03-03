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
