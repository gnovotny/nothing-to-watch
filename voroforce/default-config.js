import { defaultControlsConfig } from './controls'
import { defaultDisplayConfig } from './display'
import { defaultSimulationConfig } from './simulation'

export const defaultConfig = {
  cells: 100,
  simulation: defaultSimulationConfig,
  display: defaultDisplayConfig,
  controls: defaultControlsConfig,
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
    baseUrl: '/media',
    preload: 'v0', // 'v0', 'first' or false
    compressionFormat: 'dds',
    versions: [],
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
  ticker: {
    mode: 'manual', // 'auto' or 'manual'
  },
  benchmark: {
    enabled: false,
    simulation: {
      enabled: false,
      iterations: 10000,
    },
    display: {
      enabled: false,
      iterations: 1000,
    },
  },
}
