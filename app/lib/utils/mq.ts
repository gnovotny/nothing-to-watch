const tailwindScreens = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1600px',
}

export type Screen = keyof typeof tailwindScreens
export const SCREENS = tailwindScreens

const MEDIA_QUERY_PREFIX = '@media only screen and '

export const getMediaQueryMatch = (query: string) => window.matchMedia(query)

export const parseMediaQuery = (query: string) =>
  query.replaceAll(MEDIA_QUERY_PREFIX, '').trim()

export const matchMediaQuery = (query: string) =>
  getMediaQueryMatch(parseMediaQuery(query))

export const combineMediaQueries = (...queries: string[]) =>
  `${MEDIA_QUERY_PREFIX}${queries.map(parseMediaQuery).join(' and ')}`

// The maximum value is calculated as the minimum of the next one minus 0.02px.
// @see https://www.w3.org/TR/mediaqueries-4/#mq-min-max
const getNextBpValue = (bp: string) => {
  return `${Number.parseInt(bp) - 0.02}px`
}

export const up = (bp: Screen) => {
  const screen = SCREENS[bp]
  return `${MEDIA_QUERY_PREFIX}(min-width: ${screen})`
}

export const down = (bp: Screen) => {
  const screen = getNextBpValue(SCREENS[bp])
  return `${MEDIA_QUERY_PREFIX}(max-width: ${screen})`
}

export const between = (bpMin: Screen, bpMax: Screen) => {
  const screenMin = SCREENS[bpMin]
  const screenMax = getNextBpValue(SCREENS[bpMax])
  return `${MEDIA_QUERY_PREFIX}(min-width: ${screenMin}) and (max-width: ${screenMax})`
}

export const only = (bp: Screen) => {
  const screenKeys = Object.keys(SCREENS) as Screen[]
  const currentKeyIndex = screenKeys.indexOf(bp)
  const nextBp = screenKeys[currentKeyIndex + 1]
  return nextBp ? between(bp, nextBp) : up(bp)
}

export const orientation = (orientation: 'landscape' | 'portrait') => {
  return `${MEDIA_QUERY_PREFIX}(orientation: ${orientation})`
}

export const highDPI = (severity: 'default' | 'severe' = 'default') => {
  return `${MEDIA_QUERY_PREFIX}(min-resolution: ${severity === 'default' ? '97' : '130'}dpi)`
}
