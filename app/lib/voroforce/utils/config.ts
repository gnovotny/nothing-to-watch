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
  state: VoroforceState,
) => {
  const { userConfig, setUserConfig } = state
  const urlParams = new URLSearchParams(window.location.search)
  const cellsOverrideParam = urlParams.get('cells')
  const customLinkBase64Param = urlParams.get('customLinkBase64')

  if (customLinkBase64Param) {
    try {
      const customLink = JSON.parse(window.atob(customLinkBase64Param))
      userConfig.customLinks = [...(userConfig.customLinks ?? [])]
      const sameNameIndex = userConfig.customLinks.findIndex(
        ({ name }) => name === customLink.name,
      )
      if (sameNameIndex !== -1) {
        userConfig.customLinks[sameNameIndex] = customLink
      } else {
        userConfig.customLinks.push(customLink)
      }
      setUserConfig(userConfig)
      window.history.replaceState({}, document.title, '/')
    } catch (e) {}
  }

  config.cells = cellsOverrideParam
    ? Number.parseInt(cellsOverrideParam)
    : (userConfig.cells ?? config.cells)
  if (userConfig.noPostEffects) {
    config.display.scene.post.enabled = false
  }
  return config
}

export const getVoroforceConfigProps = (state: VoroforceState) => {
  const { playedIntro } = state
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
    state,
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
