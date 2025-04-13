import { defaultSceneConfig } from './scene'

export const defaultDisplayConfig = {
  scene: defaultSceneConfig,
  renderer: {
    depth: false,
    preserveDrawingBuffer: false,
    alpha: true,
    premultipliedAlpha: false,
    antialias: false,
    backgroundColor: '#ffffff00',
    // clearColor: [0, 1, 0, 1],
    // pixelRatio: 2, // override device pixel ratio
    scissor: {
      enabled: true,
      offset: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    },
  },
}
