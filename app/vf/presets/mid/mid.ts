import baseConfig from '../../config/config'
import postFrag from './post-mid.frag'
import { singleVersion } from '../../config/media'

export default {
  cells: 25000,
  media: {
    versions: [
      ...baseConfig.media.versions,
      ...(import.meta.env.VITE_EXPERIMENTAL_MEDIA_VERSION_3_ENABLED
        ? [singleVersion]
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
            value: [0.005, 0.005, 0.005],
            animatable: true,
            themes: {
              default: {
                value: [0.005, 0.005, 0.005],
              },
              light: {
                value: [0.995, 0.995, 0.995],
              },
            },
          },
          fAlphaStrength: {
            // value: 0.3,
            value: 1,
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
            // value: 0.3,
            value: 1,
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
