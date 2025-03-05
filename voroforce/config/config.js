import { mergeConfigs } from '../lib'
import controls from './controls'
import display from './display'
import media from './media'
import simulation from './simulation'

export const baseLatticeConfig = {
  enabled: true,
  aspect: 2 / 3,
}

export const introModeLatticeConfig = mergeConfigs(baseLatticeConfig, {
  autoTargetMediaVersion2SubgridCount: 10,
  autoTargetMediaVersion1SubgridCount: 100,
  targetCellSizeViewportPercentage: 0.075,
  // targetCellSizeViewportPercentage: 0.01,
})

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
  lattice: baseLatticeConfig,
}
