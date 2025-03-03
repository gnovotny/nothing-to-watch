import type { RectReadOnly } from 'react-use-measure'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type voroforce from '../../../voroforce/lib'
import type {
  ConfigUniforms,
  Film,
  FilmBatch,
  FilmData,
  UserConfig,
} from './utils'

type SafeVoroforceInstance = ReturnType<typeof voroforce>
export type VoroforceInstance = SafeVoroforceInstance & {
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

export enum VOROFORCE_MODES {
  preview = 'preview',
  select = 'select',
  intro = 'intro',
}

export type VoroforceState = {
  container: HTMLElement
  setContainer: (container: HTMLElement) => void
  instance: VoroforceInstance
  setInstance: (instance: VoroforceInstance) => void
  config: VoroforceInstance['config']
  setConfig: (instance: VoroforceInstance['config']) => void
  film?: Film
  setFilm: (film?: Film) => void
  filmBatches: Map<number, FilmData[]>
  mode: VOROFORCE_MODES
  setMode: (mode: VOROFORCE_MODES) => void
  exitSelectMode: () => void
  isSelectMode: boolean
  isPreviewMode: boolean
  settingsOpen: boolean
  setSettingsOpen: (settingsOpen: boolean) => void
  playedIntro: boolean
  setPlayedIntro: (playedIntro: boolean) => void
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

// const playedIntro = Boolean(localStorage.getItem('playedIntro'))
const playedIntro = false

export const store = create(
  subscribeWithSelector<VoroforceState>(
    (set, get) =>
      ({
        setInstance: (instance: VoroforceInstance) => set({ instance }),
        setConfig: (config: VoroforceInstance['config']) => set({ config }),
        setContainer: (container: HTMLElement) => set({ container }),
        setFilm: (film?: Film) => set({ film }),
        filmBatches: new Map<number, FilmBatch>(),
        mode: playedIntro ? VOROFORCE_MODES.preview : VOROFORCE_MODES.intro,
        isPreviewMode: true,
        isSelectMode: false,
        setMode: (mode: VOROFORCE_MODES) =>
          set({
            mode,
            isSelectMode: mode === VOROFORCE_MODES.select,
            isPreviewMode: mode === VOROFORCE_MODES.preview,
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
        playedIntro,
        setPlayedIntro: (playedIntro: boolean) => {
          set({
            playedIntro,
          })
          localStorage.setItem('playedIntro', String(playedIntro))
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
