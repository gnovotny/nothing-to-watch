// import mainFrag from './main.frag'
// import mainFrag from './main-test.frag'
// import mainFrag from './main-test-new.frag'
// import mainFrag from './main-castle-mountain.frag'
// import mainFrag from './main-test-new2.frag'
// import mainFrag from './main-test-new3.frag'
// import mainFrag from './main.frag'
// import mainFrag from './main2.frag'
import mainFrag from './main3.frag'
import { THEME } from '../../../types'
import { VOROFORCE_MODE } from '../../types'
// import mainFrag from './main-fisheye-test.frag'
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
        bPixelSearch: { value: true },
        fBaseColor: {
          animatable: true,
          themes: {
            default: {
              value: [0, 0, 0],
            },
            [THEME.light]: {
              value: [1, 1, 1],
            },
          },
        },
        fRoundnessMod: {
          animatable: true,
          modes: {
            default: {
              value: 1,
            },
            [VOROFORCE_MODE.select]: {
              value: 3,
            },
          },
        },
        fEdge1Mod: {
          animatable: true,
          modes: {
            default: {
              value: 1,
            },
            [VOROFORCE_MODE.select]: {
              value: 5,
            },
          },
        },
        fEdge0Mod: {
          animatable: true,
          modes: {
            default: {
              value: 1.5,
            },
            [VOROFORCE_MODE.select]: {
              value: 3,
            },
          },
        },
        fFishEyeStrength: {
          animatable: true,
          modes: {
            default: {
              value: 0.75,
            },
            [VOROFORCE_MODE.select]: {
              value: 1,
            },
          },
        },
        fFishEyeRadius: {
          animatable: true,
          modes: {
            default: {
              value: 0.5,
            },
            [VOROFORCE_MODE.select]: {
              value: 1,
            },
          },
        },
        fWeightOffsetScale: {
          animatable: true,
          modes: {
            default: {
              value: 0.5,
            },
            [VOROFORCE_MODE.select]: {
              value: 1,
            },
          },
        },
        fUnfocusedEffectMod: {
          animatable: true,
          value: 0,
        },
      },
    },
    post: {
      enabled: false,
      fragmentShader: undefined,
      uniforms: {},
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
