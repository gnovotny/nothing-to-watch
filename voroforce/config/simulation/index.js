import { forceSimulationStepConfigs } from './force'

export default {
  steps: {
    voronoi: {
      latticeNeighborLevels: 3,
      // baseFocusedWeight: 1,
      // baseFocusedDirectXNeighborWeight: 0.25,
      // baseFocusedWeight: 2.75,
      baseFocusedWeight: 0,
      // baseFocusedDirectXNeighborWeight: 0.5,
      baseFocusedDirectXNeighborWeight: 0,
    },
    force: Object.values(forceSimulationStepConfigs)[0],
  },
}
