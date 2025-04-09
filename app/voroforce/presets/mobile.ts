import postFrag from '../config/display/post.frag'

export default {
  // cells: 10000,
  cells: 100,
  media: {
    compressionFormat: 'ktx',
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
