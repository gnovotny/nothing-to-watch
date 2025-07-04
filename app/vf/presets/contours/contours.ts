import { uncompressedSingleMediaVersionConfig } from '../../config'
import baseConfig from '../../config/config'
// import postFrag from './post-mid.frag'
// import postFrag from './post-mid2.frag'
import postFrag from './post-mid3.frag'

export default {
  cells: 50000,
  media: {
    versions: [
      ...baseConfig.media.versions,
      ...(import.meta.env.VITE_EXPERIMENTAL_MEDIA_VERSION_3_ENABLED
        ? [uncompressedSingleMediaVersionConfig]
        : []),
    ],
  },
  display: {
    scene: {
      post: {
        enabled: true,
        fragmentShader: postFrag,
        uniforms: {
          fBaseColor: {
            animatable: true,
            themes: {
              default: {
                // value: [0.005, 0.005, 0.005],
                // value: [0.01, 0.01, 0.01],
                value: [0.02, 0.02, 0.02],
              },
              light: {
                value: [0.995, 0.995, 0.995],
              },
            },
          },
          fAlphaStrength: {
            animatable: true,
            modes: {
              default: {
                // value: 0.3,
                value: 1,
              },
              select: {
                value: 1,
              },
            },
          },
          fEdgeStrength: {
            animatable: true,
            modes: {
              default: {
                // value: 0.3,
                value: 1,
              },
              select: {
                value: 1,
              },
            },
          },
          iChannel0: {
            src: '/assets/rust.jpg',
            width: 512,
            height: 512,
          },
          iChannel1: {
            src: '/assets/noise.png',
            width: 256,
            height: 256,
          },
        },
      },
    },
  },
}
