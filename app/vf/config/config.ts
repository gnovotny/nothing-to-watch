import controls from './controls'
import display from './display'
import { baseLatticeConfig } from './lattice'
import media from './media'
import simulation from './simulation'

export default {
  media,
  controls,
  display,
  simulation,
  cells: 10000,
  multiThreading: {
    enabled: true,
    renderInParallel: true,
  },
  devTools: {
    enabled: false,
    expanded: true,
    expandedFolders: {
      simulation: true,
      display: true,
    },
  },
  handleVisibilityChange: {
    enabled: true,
    hiddenDelay: 5000,
  },
  lattice: baseLatticeConfig,
}
