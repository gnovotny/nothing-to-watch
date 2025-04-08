import type { RectReadOnly } from 'react-use-measure'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type voroforce from '√/index'
import type {
  ConfigUniforms,
  Film,
  FilmBatch,
  FilmData,
  UserConfig,
} from './utils'

type SafeVoroforceInstance = ReturnType<typeof voroforce>
export type VoroforceInstance = SafeVoroforceInstance & {
  ticker: NonNullable<SafeVoroforceInstance['ticker']>
  loader: NonNullable<SafeVoroforceInstance['loader']>
  controls: NonNullable<SafeVoroforceInstance['controls']>
  display: NonNullable<SafeVoroforceInstance['display']> & {
    scene: NonNullable<NonNullable<SafeVoroforceInstance['display']>['scene']>
    renderer: NonNullable<
      NonNullable<SafeVoroforceInstance['display']>['renderer']
    >
  }
  simulation: NonNullable<SafeVoroforceInstance['simulation']>
  dimensions: NonNullable<SafeVoroforceInstance['dimensions']>
}

export enum VOROFORCE_MODE {
  preview = 'preview',
  select = 'select',
  intro = 'intro',
}

export enum VOROFORCE_PRESET {
  mobile = 'mobile',
  low = 'low',
  mid = 'mid',
  high = 'high',
}

export enum THEME {
  dark = 'dark',
  light = 'light',
  system = 'system',
}

export type VoroforceState = {
  theme: THEME
  setTheme: (theme: THEME) => void
  container: HTMLElement
  setContainer: (container: HTMLElement) => void
  instance: VoroforceInstance
  setInstance: (instance: VoroforceInstance) => void
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
  settingsOpen: boolean
  setSettingsOpen: (settingsOpen: boolean) => void
  aboutOpen: boolean
  setAboutOpen: (aboutOpen: boolean) => void
  playedIntro: boolean
  setPlayedIntro: (playedIntro: boolean) => void
  preset?: VOROFORCE_PRESET
  setPreset: (preset: VOROFORCE_PRESET) => void
  filmViewBounds?: RectReadOnly
  setFilmViewBounds: (filmViewBounds: RectReadOnly) => void
  userConfig: UserConfig
  setUserConfig: (userConfig: UserConfig) => void
  configUniforms: {
    main: ConfigUniforms
    post: ConfigUniforms
    animating: ConfigUniforms
  }
}

const playedIntro = Boolean(localStorage.getItem('playedIntro'))
// const playedIntro = false

const THEME_STORAGE_KEY = 'theme'

export const store = create(
  subscribeWithSelector<VoroforceState>(
    (set, get) =>
      ({
        theme:
          (localStorage.getItem(THEME_STORAGE_KEY) as THEME) || THEME.system,
        setTheme: (theme: THEME) => {
          localStorage.setItem(THEME_STORAGE_KEY, theme)
          set({ theme })
        },
        setInstance: (instance: VoroforceInstance) => set({ instance }),
        setConfig: (config: VoroforceInstance['config']) => set({ config }),
        setContainer: (container: HTMLElement) => set({ container }),
        setFilm: (film?: Film) => set({ film }),
        filmBatches: new Map<number, FilmBatch>(),
        mode: playedIntro ? VOROFORCE_MODE.preview : VOROFORCE_MODE.intro,
        isPreviewMode: true,
        isSelectMode: false,
        setMode: (mode: VOROFORCE_MODE) =>
          set({
            mode,
            isSelectMode: mode === VOROFORCE_MODE.select,
            isPreviewMode: mode === VOROFORCE_MODE.preview,
          }),
        exitSelectMode: () => {
          get().instance?.controls?.deselect()
        },
        settingsOpen: false,
        setSettingsOpen: (settingsOpen: boolean) => {
          set({
            settingsOpen,
          })
        },
        aboutOpen: false,
        setAboutOpen: (aboutOpen: boolean) => {
          set({
            aboutOpen,
          })
        },
        playedIntro,
        setPlayedIntro: (playedIntro: boolean) => {
          set({
            playedIntro,
          })
          localStorage.setItem('playedIntro', String(playedIntro))
        },
        preset: localStorage.getItem('preset')
          ? (localStorage.getItem('preset') as VOROFORCE_PRESET)
          : undefined,
        setPreset: (preset: VOROFORCE_PRESET) => {
          set({
            preset,
          })
          localStorage.setItem('preset', preset)
        },
        setFilmViewBounds: (filmViewBounds: RectReadOnly) => {
          set({
            filmViewBounds,
          })
        },
        userConfig: localStorage.getItem('userConfig')
          ? JSON.parse(localStorage.getItem('userConfig') as string)
          : {},
        setUserConfig: (userConfig: UserConfig) => {
          set({
            userConfig,
          })
          localStorage.setItem('userConfig', JSON.stringify(userConfig))
        },
      }) as VoroforceState,
  ),
)

export const useVoroforce = store
