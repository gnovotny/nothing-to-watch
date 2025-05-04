import { getGPUTier } from 'detect-gpu'
import { mergeConfigs } from '√'
import baseConfig, { introModeLatticeConfig } from '../config'
import presets from '../presets'
import { forceSimulationStepIntroConfig } from '../config/simulation/force/intro'

import { down, matchMediaQuery } from '../../utls/mq'

import type { StoreState } from '../../store'
import type { ConfigUniform } from './uniforms'
import { type VOROFORCE_MODE, VOROFORCE_PRESET } from '../types'
import type { THEME } from '../../types'

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
  state: StoreState,
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

export const getConfig = async (state: StoreState) => {
  const {
    userConfig,
    playedIntro,
    preset: initialPreset,
    recommendedPreset: initialRecommendedPreset,
    setRecommendedPreset,
    setPreset,
    ua,
  } = state
  const urlParams = new URLSearchParams(window.location.search)
  const presetOverrideParam = urlParams.get('preset') as VOROFORCE_PRESET
  const cellsOverrideParam = urlParams.get('cells')
  const customLinkBase64Param = urlParams.get('customLinkBase64')

  const device = ua.getDevice()

  let preset = initialPreset
  let recommendedPreset = initialRecommendedPreset

  if (!preset && !recommendedPreset) {
    const isSmallScreen = matchMediaQuery(down('md')).matches
    if (device.is('mobile') || device.is('tablet')) {
      recommendedPreset = VOROFORCE_PRESET.mobile
    } else if (isSmallScreen) {
      recommendedPreset = VOROFORCE_PRESET.low
    } else {
      const gpuTier = await getGPUTier()
      console.log('gpuTier', gpuTier)
      switch (gpuTier.tier) {
        case 3:
          // recommendedPreset = VOROFORCE_PRESET.high
          recommendedPreset = VOROFORCE_PRESET.mid
          break
        case 2:
          recommendedPreset = VOROFORCE_PRESET.mid
          break
        default:
          recommendedPreset = VOROFORCE_PRESET.low
      }
    }

    if (isSmallScreen) {
      preset = recommendedPreset
      setPreset(preset)
    }
    setRecommendedPreset(recommendedPreset)
  }

  if (presetOverrideParam && VOROFORCE_PRESET[presetOverrideParam]) {
    preset = presetOverrideParam
  }

  const config = mergeConfigs(
    baseConfig,
    preset
      ? (presets as unknown as Record<VOROFORCE_PRESET, typeof baseConfig>)[
          preset
        ]
      : {},
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

  return config
}

const processVoroforceStageConfigUniforms = (
  stageConfigUniforms: Record<string, ConfigUniform>,
  mode: VOROFORCE_MODE,
  theme: THEME,
) => {
  return new Map<string, ConfigUniform>(
    Object.entries(stageConfigUniforms).map(([key, uniform]) => {
      if (typeof uniform.value === 'undefined') {
        uniform.value = uniform.modes
          ? typeof uniform.modes?.[mode]?.value !== 'undefined'
            ? uniform.modes[mode].value
            : (uniform.modes?.default?.value ?? 0)
          : typeof uniform.themes?.[theme]?.value !== 'undefined'
            ? uniform.themes[theme].value
            : (uniform.themes?.default?.value ?? 0)
      }
      return [key, uniform]
    }),
  )
}

const getVoroforceConfigUniforms = (
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  config: any,
  mode: VOROFORCE_MODE,
  theme: THEME,
) => {
  const {
    display: {
      scene: {
        main: { uniforms: mainConfigUniforms = {} },
        post: { uniforms: postConfigUniforms = {} },
      },
    },
  } = config

  return {
    main: processVoroforceStageConfigUniforms(mainConfigUniforms, mode, theme),
    post: processVoroforceStageConfigUniforms(postConfigUniforms, mode, theme),
    animating: new Map<string, ConfigUniform>(),
  }
}

export const getVoroforceConfigProps = async (state: StoreState) => {
  const config = await getConfig(state)

  console.log('config', config)

  return {
    config,
    configUniforms: getVoroforceConfigUniforms(config, state.mode, state.theme),
  }
}
