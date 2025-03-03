import { type EffectCallback, useEffect, useRef } from 'react'

export const useEffectOnce = (effect: EffectCallback) => {
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      effect()
    }
  }, [effect])
}
