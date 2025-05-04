import type { RectReadOnly } from 'react-use-measure'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import {
  type ConfigUniforms,
  type Film,
  type FilmBatch,
  type FilmData,
  type UserConfig,
  VOROFORCE_MODE,
  type VOROFORCE_PRESET,
  type VoroforceInstance,
} from './vf'
import { UAParser } from 'ua-parser-js'
import type { PerformanceMonitorApi } from './vf/utils/performance-monitor'
import { useShallow } from 'zustand/react/shallow'

export enum THEME {
  dark = 'dark',
  light = 'light',
  system = 'system',
}

export type StoreState = {
  theme: THEME
  setTheme: (theme: THEME) => void
  ua: UAParser
  container: HTMLElement
  setContainer: (container: HTMLElement) => void
  voroforce: VoroforceInstance
  setVoroforce: (instance: VoroforceInstance) => void
  config: VoroforceInstance['config']
  setConfig: (instance: VoroforceInstance['config']) => void
  film?: Film
  setFilm: (film?: Film) => void
  filmBatches: Map<number, FilmData[]>
  mode: VOROFORCE_MODE
  setMode: (mode: VOROFORCE_MODE) => void
  exitSelectMode: () => void
  isSelectMode: boolean
  isPreviewMode: boolean
  voroforceDevSceneEnabled: boolean
  setVoroforceDevSceneEnabled: (enabled: boolean) => void
  settingsOpen: boolean
  setSettingsOpen: (settingsOpen: boolean) => void
  toggleSettingsOpen: () => void
  aboutOpen: boolean
  setAboutOpen: (aboutOpen: boolean) => void
  toggleAboutOpen: () => void
  newLinkTypeOpen: boolean
  setNewLinkTypeOpen: (open: boolean) => void
  toggleNewLinkTypeOpen: () => void
  playedIntro: boolean
  setPlayedIntro: (playedIntro: boolean) => void
  preset?: VOROFORCE_PRESET
  setPreset: (preset: VOROFORCE_PRESET) => void
  recommendedPreset?: VOROFORCE_PRESET
  setRecommendedPreset: (preset: VOROFORCE_PRESET) => void
  filmViewBounds?: RectReadOnly
  setFilmViewBounds: (filmViewBounds: RectReadOnly) => void
  userConfig: UserConfig
  setUserConfig: (userConfig: UserConfig) => void
  configUniforms: {
    main: ConfigUniforms
    post: ConfigUniforms
    animating: ConfigUniforms
  }
  performanceMonitor?: PerformanceMonitorApi
  setPerformanceMonitor: (performanceMonitor: PerformanceMonitorApi) => void
}
const THEME_STORAGE_KEY = 'theme'
const PLAYED_INTRO_STORAGE_KEY = 'playedIntro'
const PRESET_STORAGE_KEY = 'preset'
const RECOMMENDED_PRESET_STORAGE_KEY = 'recommendedPreset'
const USER_CONFIG_STORAGE_KEY = 'userConfig'

const playedIntro = Boolean(localStorage.getItem(PLAYED_INTRO_STORAGE_KEY))
// const playedIntro = false

export const store = create(
  subscribeWithSelector<StoreState>(
    (set, get) =>
      ({
        theme: (localStorage.getItem(THEME_STORAGE_KEY) as THEME) || THEME.dark,
        setTheme: (theme: THEME) => {
          localStorage.setItem(THEME_STORAGE_KEY, theme)
          set({ theme })
        },
        ua: new UAParser(),
        setVoroforce: (instance: VoroforceInstance) =>
          set({ voroforce: instance }),
        setConfig: (config: VoroforceInstance['config']) => set({ config }),
        setContainer: (container: HTMLElement) => set({ container }),
        setFilm: (film?: Film) => set({ film }),
        filmBatches: new Map<number, FilmBatch>(),
        mode: playedIntro ? VOROFORCE_MODE.preview : VOROFORCE_MODE.intro,
        // mode: playedIntro ? VOROFORCE_MODE.select : VOROFORCE_MODE.intro,
        isPreviewMode: true,
        isSelectMode: false,
        setMode: (mode: VOROFORCE_MODE) =>
          set({
            mode,
            isSelectMode: mode === VOROFORCE_MODE.select,
            isPreviewMode: mode === VOROFORCE_MODE.preview,
          }),
        exitSelectMode: () => {
          get().voroforce?.controls?.deselect()
        },
        voroforceDevSceneEnabled: false,
        setVoroforceDevSceneEnabled: (voroforceDevSceneEnabled: boolean) => {
          get().voroforce.config.display.scene.dev.enabled =
            voroforceDevSceneEnabled

          if (voroforceDevSceneEnabled) {
            get().voroforce.display.scene.initDev()
          } else {
            get().voroforce.display.scene.stopDev()
          }

          set({
            voroforceDevSceneEnabled,
          })
        },
        settingsOpen: false,
        setSettingsOpen: (settingsOpen: boolean) => {
          set({
            settingsOpen,
          })
        },
        toggleSettingsOpen: () => {
          set({
            settingsOpen: !get().settingsOpen,
          })
        },
        aboutOpen: false,
        setAboutOpen: (aboutOpen: boolean) => {
          set({
            aboutOpen,
          })
        },
        toggleAboutOpen: () => {
          set({
            aboutOpen: !get().aboutOpen,
          })
        },
        newLinkTypeOpen: false,
        setNewLinkTypeOpen: (newLinkTypeOpen: boolean) => {
          set({
            newLinkTypeOpen,
          })
        },
        toggleNewLinkTypeOpen: () => {
          set({
            newLinkTypeOpen: !get().newLinkTypeOpen,
          })
        },
        playedIntro,
        setPlayedIntro: (playedIntro: boolean) => {
          set({
            playedIntro,
          })
          localStorage.setItem(
            PLAYED_INTRO_STORAGE_KEY,
            playedIntro ? String(playedIntro) : '',
          )
        },
        preset: localStorage.getItem(PRESET_STORAGE_KEY)
          ? (localStorage.getItem(PRESET_STORAGE_KEY) as VOROFORCE_PRESET)
          : undefined,
        setPreset: (preset: VOROFORCE_PRESET) => {
          set({
            preset,
          })
          localStorage.setItem(PRESET_STORAGE_KEY, preset)
        },
        recommendedPreset: localStorage.getItem(RECOMMENDED_PRESET_STORAGE_KEY)
          ? (localStorage.getItem(
              RECOMMENDED_PRESET_STORAGE_KEY,
            ) as VOROFORCE_PRESET)
          : undefined,
        setRecommendedPreset: (recommendedPreset: VOROFORCE_PRESET) => {
          set({
            recommendedPreset,
          })
          localStorage.setItem(
            RECOMMENDED_PRESET_STORAGE_KEY,
            recommendedPreset,
          )
        },
        setFilmViewBounds: (filmViewBounds: RectReadOnly) => {
          set({
            filmViewBounds,
          })
        },
        userConfig: localStorage.getItem(USER_CONFIG_STORAGE_KEY)
          ? JSON.parse(localStorage.getItem(USER_CONFIG_STORAGE_KEY) as string)
          : {},
        setUserConfig: (userConfig: UserConfig) => {
          set({
            userConfig,
          })
          localStorage.setItem(
            USER_CONFIG_STORAGE_KEY,
            JSON.stringify(userConfig),
          )
        },
        setPerformanceMonitor: (performanceMonitor) => {
          set({
            performanceMonitor,
          })
        },
      }) as StoreState,
  ),
)

export const useShallowState = <U>(selector: (state: StoreState) => U) =>
  store(useShallow(selector))
