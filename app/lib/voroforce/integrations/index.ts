import { handleIntro } from './intro'
import { handleFilmViewInSelectMode } from './film-view'
import { handleControls } from './controls'
import { handleMode } from './mode'
import { handleTicker } from './ticker'

export * from './intro'
export * from './film-view'
export * from './controls'
export * from './mode'
export * from './ticker'

export const initVoroforceIntegrations = () => {
  handleIntro()
  handleFilmViewInSelectMode()
  handleControls()
  handleMode()
  handleTicker()
}
