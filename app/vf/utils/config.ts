import { getGPUTier } from 'detect-gpu'
import { mergeConfigs } from '√'
import baseConfig, { introModeLatticeConfig } from '../config'
import { introForceSimulationStepConfig } from '../config/simulation/force/intro-force'
import presets from '../presets'

import { down, matchMediaQuery } from '../../utils/mq'

import type { THEME } from '../../consts'
import type { StoreState } from '../../store'
import {
  CELL_LIMIT,
  DEVICE_CLASS,
  VOROFORCE_MODE,
  VOROFORCE_PRESET,
} from '../consts'
import type { ConfigUniform } from './uniforms'
import type { VoroforceInstance } from '../types'
import { controlModeConfigs } from '../config/controls/controls'

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
  devTools?: boolean
  customLinks?: CustomLink[]
}

const modeConfigs: {
  [K in VOROFORCE_MODE]?: Partial<VoroforceInstance['config']>
} = {
  [VOROFORCE_MODE.intro]: {
    lattice: introModeLatticeConfig,
    simulation: {
      steps: {
        force: introForceSimulationStepConfig,
      },
    },
    media: {
      preload: 'v0', // default is "first" but "high" and "mid" media versions are loaded via "intro" lattice setup
    },
  },
  [VOROFORCE_MODE.select]: {
    controls: controlModeConfigs[VOROFORCE_MODE.select],
  },
}

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
    preset: initialPreset,
    cellLimit: initialCellLimit,
    deviceClass: initialDeviceClass,
    estimatedDeviceClass: initialEstimatedDeviceClass,
    setEstimatedDeviceClass,
    setPreset,
    setCellLimit,
    setDeviceClass,
    ua,
    mode,
  } = state
  const urlParams = new URLSearchParams(window.location.search)
  const presetOverrideParam = urlParams.get('preset') as VOROFORCE_PRESET
  const cellsOverrideParam = urlParams.get('cells')
  const customLinkBase64Param = urlParams.get('customLinkBase64')

  const device = ua.getDevice()

  let preset = initialPreset
  let deviceClass = initialDeviceClass
  let estimatedDeviceClass = initialEstimatedDeviceClass

  if (!preset && !deviceClass && !estimatedDeviceClass) {
    const isSmallScreen = matchMediaQuery(down('md')).matches
    if (device.is('mobile') || device.is('tablet')) {
      estimatedDeviceClass = DEVICE_CLASS.mobile
    } else if (isSmallScreen) {
      estimatedDeviceClass = DEVICE_CLASS.low
    } else {
      const gpuTier = await getGPUTier()
      console.log('gpuTier', gpuTier)
      switch (gpuTier.tier) {
        case 3:
          estimatedDeviceClass = DEVICE_CLASS.high
          // estimatedDeviceClass = DEVICE_CLASS.mid
          break
        case 2:
          estimatedDeviceClass = DEVICE_CLASS.mid
          break
        default:
          estimatedDeviceClass = DEVICE_CLASS.low
      }
    }

    if (isSmallScreen) {
      deviceClass = estimatedDeviceClass
      setDeviceClass(deviceClass)
      setPreset(VOROFORCE_PRESET.mobile)
      setCellLimit(CELL_LIMIT.xxs)
    }
    setEstimatedDeviceClass(estimatedDeviceClass)
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
      ...(modeConfigs[mode] ?? {}),
    },
  )

  if (customLinkBase64Param) {
    handleCustomLinkParam(customLinkBase64Param, state)
  }

  config.cells = cellsOverrideParam
    ? Number.parseInt(cellsOverrideParam)
    : (initialCellLimit ?? config.cells)

  if ('devTools' in userConfig) {
    config.devTools.enabled = userConfig.devTools
  }

  return config
}

const processVoroforceStageConfigUniforms = (
  stageConfigUniforms: Record<string, ConfigUniform>,
  animating: Map<string, ConfigUniform>,
  mode: VOROFORCE_MODE,
  theme: THEME,
) => {
  return new Map<string, ConfigUniform>(
    Object.entries(stageConfigUniforms).map(([key, uniform]) => {
      if (typeof uniform.value === 'undefined') {
        const uniformValue = uniform.modes
          ? typeof uniform.modes?.[mode]?.value !== 'undefined'
            ? uniform.modes[mode].value
            : (uniform.modes?.default?.value ?? 0)
          : typeof uniform.themes?.[theme]?.value !== 'undefined'
            ? uniform.themes[theme].value
            : (uniform.themes?.default?.value ?? 0)

        if (
          uniform.animatable &&
          typeof uniform.initial?.value === 'number' &&
          typeof uniformValue === 'number'
        ) {
          uniform.value = uniform.initial.value

          uniform.targetValue = uniformValue
          if (!animating.has(key)) {
            animating.set(key, uniform)
          }
        } else {
          uniform.value = uniformValue as number
        }
      }
      return [key, uniform]
    }),
  )
}

const getVoroforceConfigUniforms = (
  // biome-ignore lint/suspicious/noExplicitAny: todo
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

  const animating = new Map<string, ConfigUniform>()

  return {
    main: processVoroforceStageConfigUniforms(
      mainConfigUniforms,
      animating,
      mode,
      theme,
    ),
    post: processVoroforceStageConfigUniforms(
      postConfigUniforms,
      animating,
      mode,
      theme,
    ),
    animating,
  }
}

export const getVoroforceConfigProps = async (state: StoreState) => {
  const config = await getConfig(state)
  return {
    config,
    configUniforms: getVoroforceConfigUniforms(config, state.mode, state.theme),
  }
}
