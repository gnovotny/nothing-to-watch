import mainFrag from './main.frag'

export default {
  autoFocusCenter: true,
  autoFocusCenterRandom: false,
  // idlePointerMode: false,
  cells: 50000,
  // cells: 5000,
  // maxPointerSpeed: 1750, // px/s
  maxPointerSpeed: 1250, // px/s
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
  },
  simulation: {
    voronoiStep: {
      latticeNeighborLevels: 3,
      // latticeNeighborLevels: 3,
      enabled: true,
      // baseFocusedWeight: 1,
      // baseFocusedDirectXNeighborWeight: 0.25,
      // baseFocusedWeight: 2.75,
      baseFocusedWeight: 0,
      // baseFocusedDirectXNeighborWeight: 0.5,
      baseFocusedDirectXNeighborWeight: 0,
    },
    parameters: {
      // alpha: 0.45,
      // velocityDecay: 0.8,
      // velocityDecay: 0.2,
    },
    forces: [
      {
        type: 'lattice',
        enabled: true,
        strength: 0.4,
        // yFactor: 1.5,
        yFactor: 1.5,
        xFactor: 1,
        // xFactor: 2,
      },
      {
        type: 'lattice',
        enabled: true,
        strength: 0.4,
        // yFactor: 1.5,
        yFactor: 1.5,
        xFactor: 1,
        reverse: true,
        // xFactor: 2,
      },
      // {
      //   type: 'lattice',
      //   enabled: true,
      //   strength: 0.8,
      //   yFactor: 1.5,
      //   xFactor: 1,
      //   reverse: true,
      //   // xFactor: 2,
      // },
      {
        type: 'origin',
        enabled: true,
        strength: 0.8,
        yFactor: 2,
        // strength: 0.4,
      },
      {
        type: 'push',
        enabled: true,
        // strength: 0.75,
        strength: 0.15,
        selector: 'focused',
        // yFactor: 1.5,
        // yFactor: 1.5,
        yFactor: 2.5,
        // yFactor: 1,

        // diagonalFactor: 2.55,
        // xFactor: 0.5,
        // yFactor: 1.5,
        // yFactor: 1.9,
        // yFactor: 2.9,
        // yFactor: 2,
        pointerFollow: false,
        pointerFollowY: true,
        pointerFollowScaling: 0.5,
      },
    ],
  },
}
