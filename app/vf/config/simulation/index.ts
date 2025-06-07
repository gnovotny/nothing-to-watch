import { forceSimulationStepConfigs } from './force'

import { DEFAULT_VOROFORCE_MODE } from '../../consts'

export default {
  steps: {
    force: forceSimulationStepConfigs[DEFAULT_VOROFORCE_MODE],
    neighbors: {
      levels: 1,
    },
  },
  forceStepModeConfigs: forceSimulationStepConfigs,
}
