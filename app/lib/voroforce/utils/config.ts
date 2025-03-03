import { down, matchMediaQuery } from '../../utils/mq'
import { mergeConfigs } from '√/lib'
import baseConfig from '√/config'
import type { ConfigUniform } from './uniforms'

export type UserConfig = Record<string, string | number | boolean>

export const transformUserConfig = (userConfig: UserConfig) => {
  // TODO
  return userConfig
}

export const getVoroforceConfigProps = (userConfig: UserConfig) => {
  const isSmallScreen = matchMediaQuery(down('md')).matches
  const config = mergeConfigs(
    baseConfig,
    {
      cells: isSmallScreen ? 5000 : 50000,
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
