import { THEME } from '../../../consts'
import { VOROFORCE_MODE } from '../../consts'
// import mainFrag from './main.frag'
import mainFrag from './main2.frag'

export default {
  scene: {
    dev: {
      enabled: false,
    },
    main: {
      fragmentShader: mainFrag,
      uniforms: {
        iForcedMaxNeighborLevel: { value: 0 },
        bPixelSearch: { value: true },
        bMediaDistortion: { value: false },
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
        fBorderRoundnessMod: {
          animatable: true,
          modes: {
            default: {
              value: 1,
            },
            [VOROFORCE_MODE.select]: {
              // value: 3,
              value: 1,
            },
          },
        },
        fBorderSmoothnessMod: {
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
        fBorderThicknessMod: {
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
        fCenterForceBulgeStrength: {
          animatable: true,
          initial: {
            value: 0,
          },
          modes: {
            default: {
              value: 0,
            },
            [VOROFORCE_MODE.preview]: {
              // value: 1.25,
              value: 1,
              // value: 0,
            },
            [VOROFORCE_MODE.select]: {
              value: 1.5,
            },
          },
        },
        fCenterForceBulgeRadius: {
          animatable: true,
          initial: {
            value: 0,
          },
          modes: {
            default: {
              value: 0,
            },
            [VOROFORCE_MODE.preview]: {
              value: 1,
            },
            [VOROFORCE_MODE.select]: {
              // value: 1,
              value: 3,
            },
          },
        },
        fWeightOffsetScaleMod: {
          animatable: true,
          modes: {
            default: {
              value: 0.25,
              // value: 0,
            },
            [VOROFORCE_MODE.select]: {
              // value: 1,
              value: 0,
            },
          },
        },
        fUnweightedEffectMod: {
          animatable: true,
          value: 1,
        },
        fBaseXDistScale: {
          animatable: true,
          value: 1.5, // 0 = undefined, will use fallback
        },
        fWeightedXDistScale: {
          animatable: true,
          value: 1.5, // 0 = undefined, will use fallback
        },
      },
    },
    post: {
      enabled: false,
      fragmentShader: undefined,
      uniforms: {},
    },
  },
}
