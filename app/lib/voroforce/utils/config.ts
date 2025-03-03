import { down, matchMediaQuery } from '../../utils/mq'
import { mergeConfigs } from '√/lib'
import baseConfig, { introModeLatticeConfig } from '√/config'
import type { ConfigUniform } from './uniforms'
import type { VoroforceState } from '../store'
import { forceSimulationStepIntroConfig } from '√/config/simulation/force/intro'

export type UserConfig = Record<string, string | number | boolean>

export const transformUserConfig = (userConfig: UserConfig) => {
  // TODO
  return userConfig
}

export const getVoroforceConfigProps = (state: VoroforceState) => {
  const { userConfig, playedIntro } = state
  const isSmallScreen = matchMediaQuery(down('md')).matches
  const config = mergeConfigs(
    baseConfig,
    {
      cells: isSmallScreen ? 5000 : 50000,
      ...(!playedIntro
        ? {
            lattice: introModeLatticeConfig,
            simulation: {
              steps: {
                force: forceSimulationStepIntroConfig,
              },
            },
          }
        : {}),
    },
    transformUserConfig(userConfig),
  )

  const {
    display: {
      scene: {
        main: { uniforms: mainConfigUniforms = {} },
        post: { uniforms: postConfigUniforms = {} },
      },
    },
  } = config

  const configUniforms = {
    main: new Map<string, ConfigUniform>(Object.entries(mainConfigUniforms)),
    post: new Map<string, ConfigUniform>(Object.entries(postConfigUniforms)),
    animating: new Map<string, ConfigUniform>(),
  }

  return {
    config,
    configUniforms,
  }
}
