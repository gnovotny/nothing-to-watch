/**
 * clamps a middle value within a range of values between a defined minimum bound and a maximum bound
 *
 * @param min
 * @param input
 * @param max
 */
export const clamp = (min: number, input: number, max: number) =>
  Math.max(min, Math.min(input, max))

/**
 * takes two ranges of numbers (a1-a2 and b1-b2), and an offset (x). It works out how far through the range of a that x is, and calculates the equivalent position in b and returns it.
 *
 * @param a1
 * @param a2
 * @param x
 * @param b1
 * @param b2
 */
export const mapLinear = (
  a1: number,
  a2: number,
  x: number,
  b1: number,
  b2: number,
) => ((x - a1) * (b2 - b1)) / (a2 - a1) + b1

/**
 * Calculates a number between two numbers at a specific increment
 *
 * @param start
 * @param end
 * @param amt
 */
export const lerp = (start: number, end: number, amt: number) =>
  (1 - amt) * start + amt * end

export const truncate = (value: number, decimals: number) =>
  Number.parseFloat(value.toFixed(decimals))
