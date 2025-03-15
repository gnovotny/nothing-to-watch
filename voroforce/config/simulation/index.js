import { forceSimulationStepConfigs } from './force'

export default {
  steps: {
    voronoi: {
      latticeNeighborLevels: 3,
      baseFocusedWeight: 1,
      // baseFocusedDirectXNeighborWeight: 0.2,
      // baseFocusedWeight: 0,
      baseFocusedDirectXNeighborWeight: 0,
    },
    force: Object.values(forceSimulationStepConfigs)[0],
  },
}
