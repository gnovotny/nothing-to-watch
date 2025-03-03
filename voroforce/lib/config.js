import baseControlsConfig from './controls/config/controls-config'
import baseDisplayConfig from './display/config/display-config'
import baseSimulationConfig from './simulation/config/simulation-config'

const baseConfig = {
  simulation: baseSimulationConfig,
  display: baseDisplayConfig,
  controls: baseControlsConfig,
  cells: 100,
  devTools: {
    enabled: false,
    expanded: false,
    expandedFolders: {
      simulation: false,
      display: false,
    },
  },
  multiThreading: {
    enabled: false,
    renderInParallel: false,
  },
  media: {
    enabled: false,
    preload: 'v0', // 'v0', 'first' or false
  },
  lattice: {
    enabled: true,
    aspect: 2 / 3,
  },
  handleVisibilityChange: {
    enabled: false,
    hiddenDelay: 0,
  },
}

export default baseConfig
