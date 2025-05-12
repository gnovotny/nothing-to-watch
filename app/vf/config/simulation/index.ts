import { forceSimulationStepConfigs } from './force'

import {DEFAULT_VOROFORCE_MODE} from "../../consts";

export default {
  steps: {
    voronoi: {
      latticeNeighborLevels: 3,
      baseFocusedWeight: 1,
      baseFocusedImmediateXNeighborWeight: 0,
    },
    force: forceSimulationStepConfigs[DEFAULT_VOROFORCE_MODE],
  },
}
