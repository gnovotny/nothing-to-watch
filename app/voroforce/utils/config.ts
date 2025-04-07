import { mergeConfigs } from '√'
// biome-ignore lint/style/useImportType: <explanation>
import baseConfig, { introModeLatticeConfig } from '../config/base'
import * as presets from '../config/presets'
import { forceSimulationStepIntroConfig } from '../config/base/simulation/force/intro'

import { down, matchMediaQuery } from '../../utils/mq'

import { VOROFORCE_PRESET, type VoroforceState } from '../store'
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

const getIntroConfig = () => ({
  lattice: introModeLatticeConfig,
  simulation: {
    steps: {
      force: forceSimulationStepIntroConfig,
    },
  },
  media: {
    preload: 'v0', // default is "first" but "high" and "mid" media versions are loaded via "intro" lattice setup
  },
})

const handleCustomLinkParam = (
  customLinkBase64Param: string,
  state: VoroforceState,
) => {
  const { userConfig, setUserConfig } = state
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

export const getConfig = async (state: VoroforceState) => {
  const { userConfig, playedIntro, preset: initialPreset, setPreset } = state
  const urlParams = new URLSearchParams(window.location.search)
  const presetOverrideParam = urlParams.get('preset') as VOROFORCE_PRESET
  const cellsOverrideParam = urlParams.get('cells')
  const customLinkBase64Param = urlParams.get('customLinkBase64')

  let preset = initialPreset
  if (!preset) {
    const isSmallScreen = matchMediaQuery(down('md')).matches
    preset = isSmallScreen ? VOROFORCE_PRESET.low : VOROFORCE_PRESET.mid
  }

  if (presetOverrideParam && VOROFORCE_PRESET[presetOverrideParam]) {
    preset = presetOverrideParam
  }

  const config = mergeConfigs(
    baseConfig,
    (presets as unknown as Record<VOROFORCE_PRESET, typeof baseConfig>)[preset],
    {
      ...(!playedIntro ? getIntroConfig() : {}),
    },
  )

  if (customLinkBase64Param) {
    handleCustomLinkParam(customLinkBase64Param, state)
  }

  config.cells = cellsOverrideParam
    ? Number.parseInt(cellsOverrideParam)
    : (userConfig.cells ?? config.cells)
  // if (userConfig.noPostEffects) {
  //   config.display.scene.post.enabled = false
  // }
  return config
}

export const getVoroforceConfigProps = async (state: VoroforceState) => {
  const config = await getConfig(state)

  console.log('config', config)

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
