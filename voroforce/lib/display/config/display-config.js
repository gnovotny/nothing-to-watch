import baseSceneConfig from '../scene/config/scene-config'

const baseDisplayConfig = {
  scene: baseSceneConfig,
  renderer: {
    depth: true,
    preserveDrawingBuffer: false,
    alpha: true,
    premultipliedAlpha: false,
    antialias: false,
    backgroundColor: '#ffffff00',
    // clearColor: [0, 1, 0, 1],
    // pixelRatio: 2, // override device pixel ratio
    scissor: {
      enabled: true,
      // padding: 10,
      offset: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    },
  },
}

export default baseDisplayConfig
