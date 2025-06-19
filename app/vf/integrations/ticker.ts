import type { VisibilityChangeEvent } from '√'
import { store } from '../../store'
import { handleAnimatingUniforms, initPerformanceMonitor } from '../utils'

export const handleTicker = () => {
  const {
    voroforce,
    configUniforms: { animating: animatingUniforms },
  } = store.getState()

  const performanceMonitor = initPerformanceMonitor()
  store.setState({
    performanceMonitor,
  })

  // controls.addEventListener('pointerMove', ({ pointer }) => {})
  voroforce.ticker.listen('tick', (() => {
    handleAnimatingUniforms(animatingUniforms)
    performanceMonitor.onTick()
  }) as unknown as EventListener)

  voroforce.listen('visibilityChange', ((e: VisibilityChangeEvent) => {
    performanceMonitor.onVisibilityChange(e.visible)
  }) as unknown as EventListener)
}
