import mainFrag from './main.frag'
import { forceSimulationStepConfigs } from './simulation/force'

export default {
  cells: 50000,
  media: {
    enabled: true,
    baseUrl: import.meta.env.VITE_TEXTURES_BASE_URL ?? '/media',
    versions: [
      {
        cols: 512,
        rows: 288,
        width: 2048,
        height: 624,
        layers: 1,
        layerIndexStart: 0,
        layerSrcFormat: '/low/dds/{INDEX}.dds',
      },
      {
        cols: 90,
        rows: 60,
        width: 1980,
        height: 1980,
        layers: 6,
        layerIndexStart: 0,
        layerSrcFormat: '/mid/dds/{INDEX}.dds',
      },
      {
        cols: 18,
        rows: 12,
        width: 1980,
        height: 1980,
        layers: 141,
        layerIndexStart: 0,
        layerSrcFormat: '/high/dds/{INDEX}.dds',
      },
    ],
  },
  multiThreading: {
    enabled: true,
    renderInParallel: true,
  },
  lattice: {
    mode: 'default',
  },
  controls: {
    autoFocusCenter: {
      enabled: true,
      random: false,
    },
    maxPointerSpeed: 0.5, // percentage of diagonal per second (px/s)
    maxPointerReactionRadius: 0.25, // percentage of diagonal
  },
  display: {
    scene: {
      dev: {
        enabled: false,
      },
      main: {
        // enabled: false,
        fragmentShader: mainFrag,
        uniforms: {},
      },
    },
    renderer: {
      scissor: {
        enabled: true,
        offset: {
          top: 0,
          right: 0,
          bottom: 0,
          // left: 100,
        },
      },
    },
  },
  simulation: {
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
  },
  devTools: {
    enabled: false,
    expanded: false,
  },
  handleVisibilityChange: {
    enabled: true,
    hiddenDelay: 1000,
  },
}
