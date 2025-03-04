import { mergeConfigs } from '√/lib'
import baseConfig, { introModeLatticeConfig } from '√/config'
import { forceSimulationStepIntroConfig } from '√/config/simulation/force/intro'

import { down, matchMediaQuery } from '../../utils/mq'

import type { VoroforceState } from '../store'
import type { ConfigUniform } from './uniforms'

export type CustomLink = {
  name: string
  baseUrl: string
  slug: boolean
  property: 'title' | 'tmdbId' | 'imdbId'
}

export type UserConfig = {
  cells?: number
  noPostEffects?: boolean
  forceHigherQuality?: boolean
  customLinks?: CustomLink[]
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
              preload: 'v0', // default is "first" but "high" and "mid" media versions are loaded via "intro" lattice setup
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
