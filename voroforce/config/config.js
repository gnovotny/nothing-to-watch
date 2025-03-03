import media from './media'
import controls from './controls'
import display from './display'
import simulation from './simulation'

export default {
  media,
  controls,
  display,
  simulation,
  cells: 50000,
  multiThreading: {
    enabled: true,
    renderInParallel: true,
  },
  devTools: {
    enabled: false,
    expanded: false,
  },
  handleVisibilityChange: {
    enabled: false,
    hiddenDelay: 1000,
  },
}
