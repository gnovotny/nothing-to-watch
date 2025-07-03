import { handleControls } from './controls'
import { handleMode } from './mode'
import { handleTheme } from './theme'
import { handleTicker } from './ticker'

export * from './controls'
export * from './mode'
export * from './theme'
export * from './ticker'

export const initVoroforceIntegrations = () => {
  // handleIntro()
  handleControls()
  handleMode()
  handleTheme()
  handleTicker()
}
