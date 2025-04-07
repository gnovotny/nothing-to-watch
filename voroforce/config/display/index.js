// import mainFrag from './main.frag'
// import mainFrag from './main-test.frag'
// import mainFrag from './main-test-new.frag'
// import mainFrag from './main-castle-mountain.frag'
// import mainFrag from './main-test-new2.frag'
import mainFrag from './main-test-new3.frag'
// import mainFrag from './main-fisheye-test.frag'
// import postFrag from './post.frag'
// import postFrag from './post-test.frag'
// import postFrag from './post-test-new.frag'
// import postFrag from './post-castle-mountain.frag'
// import postFrag from './post-test-new2.frag'
import postFrag from './post-test-new3.frag'
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
        fEdge1Mod: {
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
        fEdge0Mod: {
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
