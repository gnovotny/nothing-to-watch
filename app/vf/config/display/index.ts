import mainFrag from './main3.frag'
import { THEME } from '../../../consts'

import { VOROFORCE_MODE } from '../../consts'

export default {
  scene: {
    dev: {
      enabled: false,
    },
    main: {
      fragmentShader: mainFrag,
      uniforms: {
        iForceMaxNeighborLevel: { value: 0 },
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
          initial: {
            value: 0,
          },
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
          initial: {
            value: 0,
          },
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
        fUnWeightedEffectMod: {
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
}
