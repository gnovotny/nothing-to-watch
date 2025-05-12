import controls from './controls'
import display from './display'
import media from './media'
import simulation from './simulation'
import { baseLatticeConfig } from './lattice'

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
    enabled: true,
    hiddenDelay: 5000,
  },
  lattice: baseLatticeConfig,
}
