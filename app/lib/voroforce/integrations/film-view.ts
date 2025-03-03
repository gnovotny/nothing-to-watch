import { store, VOROFORCE_MODES } from '../store'
import { forceSimulationStepConfigs } from '√/config'

export const handleFilmViewInSelectMode = () => {
  store.subscribe(
    (state) => state.filmViewBounds,
    (bounds) => {
      const mode = store.getState().mode
      if (!bounds || mode !== VOROFORCE_MODES.select) return
      const config = forceSimulationStepConfigs[mode].forces.find(
        ({ type }) => type === 'moveCenterToPoint',
      )
      if (!config?.point) return
      Object.assign(config.point, {
        x: bounds.width + (window.innerWidth - bounds.width) / 2,
        y: window.innerHeight / 2,
      })
      store
        .getState()
        .instance?.simulation.updateForceStepConfig(
          forceSimulationStepConfigs[mode],
        )
    },
  )
}
