import { useEffect, useState } from 'react'

import { combineMediaQueries, matchMediaQuery } from '../utils/mq'

const match = (query: string | string[]) =>
  matchMediaQuery(Array.isArray(query) ? combineMediaQueries(...query) : query)

export const useMediaQuery = (query: string | string[]) => {
  const [value, setValue] = useState(match(query).matches)

  useEffect(() => {
    const onChange = (mqlEvent: MediaQueryListEvent) => {
      setValue(mqlEvent.matches)
    }

    const mqList = match(query)
    mqList.addEventListener('change', onChange)

    return () => mqList.removeEventListener('change', onChange)
  }, [query])

  return value
}
