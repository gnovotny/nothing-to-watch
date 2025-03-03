import media from './media'
import controls from './controls'
import display from './display'
import simulation from './simulation'
import { mergeConfigs } from '../lib'

export const baseLatticeConfig = {
  enabled: true,
  aspect: 2 / 3,
}

export const introModeLatticeConfig = mergeConfigs(baseLatticeConfig, {
  autoTargetMediaVersion2SubgridCount: 5,
  targetCellSizeViewportPercentage: 0.075,
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
