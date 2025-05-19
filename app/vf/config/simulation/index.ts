import { forceSimulationStepConfigs } from './force'

import { DEFAULT_VOROFORCE_MODE } from '../../consts'

export default {
  steps: {
    force: forceSimulationStepConfigs[DEFAULT_VOROFORCE_MODE],
    neighbors: {
      latticeNeighborLevels: 3,
    },
  },
}
