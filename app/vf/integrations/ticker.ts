import { store } from '../../store'
import { handleAnimatingUniforms } from '../utils'
import { PerformanceMonitor } from '../utils/performance-monitor'

export const handleTicker = () => {
  const {
    voroforce: { ticker },
    configUniforms: { animating: animatingUniforms },
  } = store.getState()

  // controls.addEventListener('pointerMove', ({ pointer }) => {})
  ticker.listen('tick', (() => {
    // console.log('tick')
    handleAnimatingUniforms(animatingUniforms)
  }) as unknown as EventListener)

  PerformanceMonitor()
}
