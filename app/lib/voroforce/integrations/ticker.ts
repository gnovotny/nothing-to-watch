import { store } from '../store'
import { handleAnimatingUniforms } from '../utils'

export const handleTicker = () => {
  const {
    instance: { ticker },
    configUniforms: { animating: animatingUniforms },
  } = store.getState()

  // controls.addEventListener('pointerMove', ({ pointer }) => {})
  ticker.addEventListener('tick', (() => {
    // console.log('tick')
    handleAnimatingUniforms(animatingUniforms)
  }) as unknown as EventListener)
}
