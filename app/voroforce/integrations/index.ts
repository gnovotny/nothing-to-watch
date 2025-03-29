import { handleControls } from './controls'
import { handleFilmViewInSelectMode } from './film-view'
import { handleMode } from './mode'
import { handleTicker } from './ticker'
import { handleTheme } from './theme'

export * from './film-view'
export * from './controls'
export * from './mode'
export * from './theme'
export * from './ticker'

export const initVoroforceIntegrations = () => {
  // handleIntro()
  handleFilmViewInSelectMode()
  handleControls()
  handleMode()
  handleTheme()
  handleTicker()
}
