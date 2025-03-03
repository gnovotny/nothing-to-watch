import { store } from '../store'
import { handleTransitioningUniforms } from '../utils'

export const handleTicker = () => {
  const {
    instance: { ticker },
    configUniforms: { transitioning: transitioningUniforms },
  } = store.getState()

  // controls.addEventListener('pointerMove', ({ pointer }) => {})
  ticker.addEventListener('tick', (() => {
    // console.log('tick')
    handleTransitioningUniforms(transitioningUniforms)
  }) as unknown as EventListener)
}
