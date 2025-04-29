import { store } from '../../store'
import { handleAnimatingUniforms } from '../utils'
import { initPerformanceMonitor } from '../utils/performance-monitor'

export const handleTicker = () => {
  const {
    voroforce: { ticker },
    configUniforms: { animating: animatingUniforms },
  } = store.getState()

  const performanceMonitor = initPerformanceMonitor()
  store.setState({
    performanceMonitor,
  })

  // controls.addEventListener('pointerMove', ({ pointer }) => {})
  ticker.listen('tick', (() => {
    handleAnimatingUniforms(animatingUniforms)
    performanceMonitor.onTick()
  }) as unknown as EventListener)
}
