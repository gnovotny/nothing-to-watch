import { VOROFORCE_MODE } from '../../consts'
import type { VoroforceInstance } from '../../types'

export default {
  autoFocusCenter: {
    enabled: true,
    random: false,
  },
  maxSpeed: 10,
  ease: 0.15,
  freezeOnShake: {
    enabled: true,
  },
  freezeOnJolt: {
    enabled: true,
  },
}

export const controlModeConfigs: {
  [K in VOROFORCE_MODE]?: VoroforceInstance['controls']['config']
} = {
  [VOROFORCE_MODE.select]: {
    maxSpeed: 2,
    ease: 0.01,
    freezeOnShake: {
      enabled: false,
    },
    freezeOnJolt: {
      enabled: false,
    },
  },
}
