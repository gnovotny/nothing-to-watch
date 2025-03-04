import { down, matchMediaQuery } from '../../utils/mq'
import { mergeConfigs } from '√/lib'
import baseConfig, { introModeLatticeConfig } from '√/config'
import type { ConfigUniform } from './uniforms'
import type { VoroforceState } from '../store'
import { forceSimulationStepIntroConfig } from '√/config/simulation/force/intro'

// export type UserConfig = Record<string, string | number | boolean>
export type UserConfig = {
  cells?: number
  noPostEffects?: boolean
  forceHigherQuality?: boolean
}

export const transformConfig = (
  config: typeof baseConfig,
  userConfig: UserConfig,
) => {
  const urlParams = new URLSearchParams(window.location.search)
  const cellsOverride = urlParams.get('cells')

  config.cells = cellsOverride
    ? Number.parseInt(cellsOverride)
    : (userConfig.cells ?? config.cells)
  if (userConfig.noPostEffects) {
    config.display.scene.post.enabled = false
  }
  return config
}

export const getVoroforceConfigProps = (state: VoroforceState) => {
  const { userConfig, playedIntro } = state
  const isSmallScreen = matchMediaQuery(down('md')).matches
  const config = transformConfig(
    mergeConfigs(baseConfig, {
      cells: isSmallScreen ? 5000 : 50000,
      ...(!playedIntro
        ? {
            lattice: introModeLatticeConfig,
            simulation: {
              steps: {
                force: forceSimulationStepIntroConfig,
              },
            },
            media: {
              preload: 'v0', // default is "first" but high and mid are loaded via intro lattice setup
            },
          }
        : {}),
    }),
    userConfig,
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
