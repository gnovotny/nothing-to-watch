import mainFrag from './main.frag'
import postFrag from './post.frag'

export default {
  scene: {
    dev: {
      enabled: false,
    },
    main: {
      // enabled: false,
      fragmentShader: mainFrag,
      uniforms: {
        iForceMaxNeighborLevel: { value: 0 },
        bForceMaxQuality: { value: false },
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
      },
    },
    post: {
      enabled: true,
      fragmentShader: postFrag,
      uniforms: {
        fAlphaStrength: {
          // value: 0.3,
          value: 0.3,
          animatable: true,
          modes: {
            default: {
              value: 0.3,
            },
            select: {
              value: 1,
            },
          },
        },
        fEdgeStrength: {
          value: 0.3,
          animatable: true,
          modes: {
            default: {
              value: 0.3,
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
        // left: 100,
      },
    },
  },
}
