/**
 * Smooth easing function for inhale that ensures a continuous transition
 * into the exhale phase
 * @param {number} t - Input between 0 and 1
 * @returns {number} Output between 0 and 1
 */
function smoothInhaleEasing(t) {
  // Modified sine-based easing for inhale
  // Starts slow, accelerates in middle, and gradually approaches peak
  // with a derivative that matches the beginning of exhale for smoothness
  return Math.sin((t * Math.PI) / 2)
}

/**
 * Smooth easing function for exhale that ensures a continuous transition
 * from the inhale phase
 * @param {number} t - Input between 0 and 1
 * @returns {number} Output between 1 and 0
 */
function smoothExhaleEasing(t) {
  // Modified cosine-based easing for exhale
  // Starts with matching derivative from inhale and smoothly approaches 0
  return Math.cos((t * Math.PI) / 2)
}

/**
 * Creates a seeded random number generator function
 * @param {number} seed - Seed value
 * @returns {Function} Function that generates deterministic random numbers
 */
function createSeededRandom(seed) {
  // biome-ignore lint/complexity/useArrowFunction: <explanation>
  return function (n = 0) {
    const x = Math.sin(n + seed) * 10000
    return x - Math.floor(x)
  }
}

/**
 * Continuous diaphragmatic breathing easing function with natural variations
 *
 * This easing function simulates the natural rhythm of diaphragmatic breathing with:
 * - No pauses between inhale and exhale (continuous flow)
 * - Subtle variations in breathing pattern
 * - Natural micro-fluctuations during inhale and exhale phases
 * - Occasional deeper or shallower breaths
 *
 * @param {number} _t - Input between 0 and 1 representing progress through the breathing cycle
 * @param {Object} options - Optional parameters to customize the breathing pattern
 * @param {number} options.inhaleRatio - Base portion of cycle spent inhaling (default: 0.45)
 * @param {number} options.exhaleRatio - Base portion of cycle spent exhaling (default: 0.55)
 * @param {number} options.variationAmount - Amount of natural variation (0-1, default: 0.15)
 * @param {number} options.seed - Seed for the pseudorandom generators (default: current timestamp)
 * @returns {number} Output between 0 (fully exhaled) and 1 (fully inhaled)
 */
export function diaphragmaticBreathing(_t, options = {}) {
  // Default parameters for a typical continuous breathing pattern
  const {
    inhaleRatio = 0.45, // 45% of cycle spent inhaling
    exhaleRatio = 0.55, // 55% of cycle spent exhaling
    variationAmount = 0.5, // Amount of natural variation (0-1)
    seed = Date.now(), // Seed for pseudorandom generators
  } = options

  // Ensure t is between 0 and 1
  const t = Math.min(1, Math.max(0, _t))

  // Create seeded random generators for different aspects of variation
  const rng1 = createSeededRandom(seed)
  const rng2 = createSeededRandom(seed + 1000)

  // Generate breath-specific variations
  // These stay constant within a single breath cycle
  const cycleNumber = Math.floor(t * 100) // Change variations every cycle
  const breathDepthVariation = rng1(cycleNumber) * 2 - 1 // -1 to 1
  const phaseVariation = rng2(cycleNumber) * 2 - 1 // -1 to 1

  // Apply variations to the breathing ratios
  // Occasionally make inhale or exhale slightly longer/shorter
  const variableInhaleRatio =
    inhaleRatio * (1 + phaseVariation * 0.1 * variationAmount)
  const variableExhaleRatio =
    exhaleRatio * (1 - phaseVariation * 0.1 * variationAmount)

  // Normalize the ratios to ensure they sum to 1
  const total = variableInhaleRatio + variableExhaleRatio
  const normalizedInhaleRatio = variableInhaleRatio / total
  const normalizedExhaleRatio = variableExhaleRatio / total

  // Calculate the boundary between inhale and exhale phases
  const inhaleEnd = normalizedInhaleRatio

  // Function to add micro-fluctuations to the breathing curve
  const addMicroFluctuations = (value, progress, magnitude) => {
    // Generate a natural, non-uniform fluctuation using multiple sine waves
    const fluctuation =
      Math.sin(progress * Math.PI * 2 * 3) * 0.3 +
      Math.sin(progress * Math.PI * 2 * 7) * 0.2 +
      Math.sin(progress * Math.PI * 2 * 11) * 0.1

    // Scale the fluctuation by the desired magnitude and add to the value
    return value + fluctuation * magnitude * variationAmount
  }

  let breathValue

  if (t < inhaleEnd) {
    // During inhale phase with natural variation
    const inhaleProgress = t / normalizedInhaleRatio

    // Use a smoother, more continuous easing function
    breathValue = smoothInhaleEasing(inhaleProgress)

    // Add subtle micro-fluctuations to the inhale curve
    breathValue = addMicroFluctuations(breathValue, inhaleProgress, 0.03)
  } else {
    // During exhale phase with natural variation
    const exhaleProgress = (t - inhaleEnd) / normalizedExhaleRatio

    // Use a smoother, more continuous easing function for exhale
    breathValue = smoothExhaleEasing(exhaleProgress)

    // Add subtle micro-fluctuations to the exhale curve
    breathValue = addMicroFluctuations(breathValue, exhaleProgress, 0.04)
  }

  // Apply occasional deeper or shallower breath variations
  const depthAdjustment = 0.92 + breathDepthVariation * 0.08 * variationAmount

  // If it's a shallower breath, don't fully inhale; if deeper, exaggerate slightly
  if (breathValue > 0.5) {
    breathValue = 0.5 + (breathValue - 0.5) * depthAdjustment
  }

  // Ensure the value stays within valid range after all adjustments
  return Math.min(1, Math.max(0, breathValue))
}
