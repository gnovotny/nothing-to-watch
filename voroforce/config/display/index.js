import mainFrag from './main.frag'
// import mainFrag from './main-fisheye-test.frag'
import postFrag from './post.frag'
// import postFrag from './post-fisheye-test.frag'

export default {
  scene: {
    dev: {
      enabled: false,
    },
    main: {
      fragmentShader: mainFrag,
      uniforms: {
        iForceMaxNeighborLevel: { value: 0 },
        bForceMaxQuality: { value: false },
        fBaseColor: {
          value: [0, 0, 0],
          animatable: true,
          themes: {
            default: {
              value: [0, 0, 0],
            },
            light: {
              value: [1, 1, 1],
            },
          },
        },
        fRoundnessMod: {
          value: 1,
          animatable: true,
          modes: {
            default: {
              value: 1,
            },
            select: {
              value: 3,
            },
          },
        },
        fEdgeMod: {
          value: 1,
          animatable: true,
          modes: {
            default: {
              value: 1,
            },
            select: {
              value: 5,
            },
          },
        },
        fEdgeSmoothnessMod: {
          value: 1.5,
          animatable: true,
          modes: {
            default: {
              value: 1.5,
            },
            select: {
              value: 3,
            },
          },
        },
      },
    },
    post: {
      enabled: true,
      fragmentShader: postFrag,
      uniforms: {
        fBaseColor: {
          value: [0.05, 0.05, 0.05],
          animatable: true,
          themes: {
            default: {
              value: [0.05, 0.05, 0.05],
            },
            light: {
              value: [0.95, 0.95, 0.95],
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
      },
    },
  },
  renderer: {
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
