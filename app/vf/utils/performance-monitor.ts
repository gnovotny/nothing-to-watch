type PerformanceMonitorSubscriptionApi = {
  onIncline: (api: PerformanceMonitorApi) => void
  onDecline: (api: PerformanceMonitorApi) => void
  onChange: (api: PerformanceMonitorApi) => void
  onFallback: (api: PerformanceMonitorApi) => void
}

export type PerformanceMonitorApi = {
  /** Whether the page is visible */
  visible: boolean
  /** Current fps */
  fps: number
  /** Current performance factor, between 0 and 1 */
  factor: number
  /** Current highest fps, you can use this to determine device refresh rate */
  refreshRate: number
  /** Fps samples taken over time  */
  samples: number[]
  /** Averages of frames taken over n iterations   */
  averages: number[]
  index: number
  flipped: number
  fallback: boolean
  subscriptions: Map<symbol, Partial<PerformanceMonitorSubscriptionApi>>
  subscribe: (sub: Partial<PerformanceMonitorSubscriptionApi>) => () => void
  onTick: () => void
  onVisibilityChange: (visible: boolean) => void
}

type PerformanceMonitorProps = {
  /** How much time in milliseconds to collect an average fps, 250 */
  ms?: number
  /** How many interations of averages to collect, 10 */
  iterations?: number
  /** The percentage of iterations that are matched against the lower and upper bounds, 0.75 */
  threshold?: number
  /** A function that receive the max device refreshRate to determine lower and upper bounds which create a margin where neither incline nor decline should happen, (refreshRate) => (refreshRate > 90 ? [50, 90] : [50, 60]) */
  bounds?: (refreshRate: number) => [lower: number, upper: number]
  /** How many times it can inline or decline before onFallback is called, Infinity */
  flipflops?: number
  /** The factor increases and decreases between 0-1, this prop sets the starting value, 0.5 */
  factor?: number
  /** The step that gets added or subtracted to or from the factor on each incline/decline, 0.1 */
  step?: number
  /** When performance is higher than the upper bound (good!) */
  onIncline?: (api: PerformanceMonitorApi) => void
  /** When performance is lower than the upper bound (bad!) */
  onDecline?: (api: PerformanceMonitorApi) => void
  /** Incline and decline will change the factor, this will trigger when that happened */
  onChange?: (api: PerformanceMonitorApi) => void
  /** Called after when the number of flipflops is reached, it indicates instability, use the function to set a fixed baseline */
  onFallback?: (api: PerformanceMonitorApi) => void
}

export function initPerformanceMonitor(
  {
    iterations = 10,
    ms = 250,
    // ms = 1000,
    threshold = 0.75,
    // threshold = 0.25,
    step = 0.1,
    factor: _factor = 0.5,
    flipflops = Number.POSITIVE_INFINITY,
    bounds = (refreshRate) => (refreshRate > 100 ? [60, 100] : [50, 60]),
    onIncline,
    onDecline,
    onChange,
    onFallback,
  }: PerformanceMonitorProps = {} as PerformanceMonitorProps,
) {
  const decimalPlacesRatio = 10 ** 0
  let lastFactor = 0
  let previous = performance.now()

  const api: PerformanceMonitorApi = {
    visible: true,
    fps: 0,
    index: 0,
    factor: _factor,
    flipped: 0,
    refreshRate: 0,
    fallback: false,
    samples: [],
    averages: [],
    subscriptions: new Map(),
    subscribe: (sub) => {
      const key = Symbol()
      api.subscriptions.set(key, sub)
      return () => void api.subscriptions.delete(key)
    },
    onVisibilityChange: (visible) => {
      api.visible = visible
      api.samples = []
    },
    onTick: () => {
      const { samples, averages } = api

      if (api.fallback) return // If the fallback has been reached, abort
      if (averages.length >= iterations) return

      const now = performance.now()
      const delta = now - previous
      previous = now

      if (delta > 500) {
        // Throttling or sleep likely happening
        api.samples = []
        return
      }

      samples.push(now)
      const msPassed = samples[samples.length - 1] - samples[0]

      if (msPassed < ms) return

      api.fps =
        Math.round((samples.length / msPassed) * 1000 * decimalPlacesRatio) /
        decimalPlacesRatio

      api.samples = []

      api.refreshRate = Math.max(api.refreshRate, api.fps)
      averages[api.index++ % iterations] = api.fps

      if (averages.length !== iterations) return

      const [lower, upper] = bounds(api.refreshRate)
      const upperBounds = averages.filter((value) => value >= upper)
      const lowerBounds = averages.filter((value) => value < lower)
      // Trigger incline when more than -threshold- avgs exceed the upper bound
      if (upperBounds.length > iterations * threshold) {
        api.factor = Math.min(1, api.factor + step)
        api.flipped++
        if (onIncline) onIncline(api)
        api.subscriptions.forEach((sub) => sub.onIncline?.(api))
      }
      // Trigger decline when more than -threshold- avgs are below the lower bound
      if (lowerBounds.length > iterations * threshold) {
        api.factor = Math.max(0, api.factor - step)
        api.flipped++
        if (onDecline) onDecline(api)
        api.subscriptions.forEach((sub) => sub.onDecline?.(api))
      }

      if (lastFactor !== api.factor) {
        lastFactor = api.factor
        if (onChange) onChange(api)
        api.subscriptions.forEach((sub) => sub.onChange?.(api))
      }

      if (api.flipped > flipflops && !api.fallback) {
        api.fallback = true
        if (onFallback) onFallback(api)
        api.subscriptions.forEach((sub) => sub.onFallback?.(api))
      }
      api.averages = []

      // Resetting the refreshRate creates more problems than it solves atm
      // api.refreshRate = 0
    },
  }

  return api
}
