import mainFrag from './main.frag'

export default {
  autoFocusCenter: true,
  // idlePointerMode: false,
  cells: 50000,
  // cells: 5000,
  maxPointerSpeed: 1750, // px/s
  media: {
    enabled: true,
    baseUrl: import.meta.env.VITE_TEXTURES_BASE_URL ?? '/media',
    versions: [
      {
        cols: 512,
        rows: 288,
        width: 2048,
        height: 624,
        // height: 1728,
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
  // display: {
  //   scene: {
  //     main: {
  //       uniforms: {
  //         uSdfPadding: 0.0005,
  //         uSdfSmoothingEdge0: -0.001,
  //         uSdfSmoothingEdge1: 0.001,
  //         uSdfSmoothingEdge1DynamicPaddingFactor: 0,
  //       },
  //     },
  //   },
  // },
  display: {
    scene: {
      dev: {
        enabled: false,
      },
      main: {
        // enabled: false,
        fragmentShader: mainFrag,
      },
    },
  },
  simulation: {
    voronoiStep: {
      enabled: true,
      latticeNeighborLevels: 3,
      baseFocusedWeight: 15,
      baseFocusedDirectXNeighborWeight: 0.5,
    },
    parameters: {
      // alpha: 0.15,
      velocityDecay: 0.8,
    },
    forces: [
      {
        type: 'lattice',
        enabled: true,
        strength: 0.8,
        // yFactor: 1.9,
        // xFactor: 2,
      },
      {
        type: 'origin',
        enabled: true,
        strength: 0.8,
      },
      {
        type: 'push',
        enabled: true,
        strength: 0.15,
        selector: 'focused',
        // diagonalFactor: 2.55,
        // xFactor: 0.5,
        yFactor: 1.3,
        // yFactor: 1.5,
        // yFactor: 1.9,
        // yFactor: 2.9,
        // yFactor: 2,
        pointerFollow: false,
        pointerFollowY: false,
      },
    ],
  },
}
