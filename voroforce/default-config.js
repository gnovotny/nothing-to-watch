import { defaultControlsConfig } from './controls'
import { defaultDisplayConfig } from './display'
import { defaultSimulationConfig } from './simulation'

export const defaultConfig = {
  simulation: defaultSimulationConfig,
  display: defaultDisplayConfig,
  controls: defaultControlsConfig,
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
    aspect: undefined,
    latticeAspect: undefined,
    latticeAspectConstraints: 'min', // 'min' or 'max'

    autoTargetMediaVersion2SubgridCount: undefined,
    autoTargetMediaVersion1SubgridCount: undefined,
    targetCellSizeViewportPercentage: undefined,
  },
  handleVisibilityChange: {
    enabled: false,
    hiddenDelay: 0,
  },
}
