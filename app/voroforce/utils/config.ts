import baseConfig, { introModeLatticeConfig } from '√/config'
import { forceSimulationStepIntroConfig } from '√/config/simulation/force/intro'
import { mergeConfigs } from '√/lib'

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
      cells: isSmallScreen ? 10000 : 50000,
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
      media: {
        versions: [
          ...baseConfig.media.versions,
          // {
          //   // cols: 6,
          //   // rows: 4,
          //   cols: 1,
          //   rows: 1,
          //   realCols: 9,
          //   realRows: 6,
          //   // width: 300,
          //   // height: 450,
          //   tileWidth: 220,
          //   tileHeight: 330,
          //   width: 1980,
          //   height: 1980,
          //
          //   layers: 50000, // real layers for 50000/54: 925.9 = 926
          //   layerIndexStart: 0,
          //   layerSrcFormat: '/posters/{INDEX}.jpg',
          //   // layerSrcFormat: async (
          //   //   layerIndex: number,
          //   //   voroforceStore: VoroforceInstance['store'],
          //   // ) => {
          //   //   const posterUrl = (
          //   //     await getCellFilm(
          //   //       voroforceStore.get('cells')[layerIndex],
          //   //       state.filmBatches,
          //   //     )
          //   //   )?.poster
          //   //   if (posterUrl) return `${appConfig.posterBaseUrl}${posterUrl}`
          //   // },
          //   type: 'extra',
          // },
        ],
      },
    }),
    state,
  )

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
