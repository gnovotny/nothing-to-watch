import { VOROFORCE_MODE } from '../../consts'
import type { VoroforceInstance } from '../../types'

export default {
  autoFocusCenter: {
    enabled: true,
    random: true,
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
    maxSpeed: 100,
    ease: 1,
    freezeOnShake: {
      enabled: false,
    },
    freezeOnJolt: {
      enabled: false,
    },
  },
}
