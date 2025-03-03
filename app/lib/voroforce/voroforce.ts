import baseConfig from '√/config'
import voroforce, { mergeConfigs } from '√/lib'

import { store, type UnsafeVoroforceInstance } from './store'
import {
  handleControls,
  handleFilmViewInSelectMode,
  handleIntro,
  handleMode,
  handleTicker,
} from './integrations'
import { down, matchMediaQuery } from '../utils/mq'
import { type ConfigUniform, transformUserConfig } from './utils'

const initVoroforceIntegration = () => {
  handleIntro()
  handleFilmViewInSelectMode()
  handleControls()
  handleMode()
  handleTicker()
}

export const createVoroforce = (container: HTMLElement) => {
  const isSmallScreen = matchMediaQuery(down('md')).matches
  const config = mergeConfigs(
    baseConfig,
    {
      cells: isSmallScreen ? 5000 : 50000,
    },
    transformUserConfig(store.getState().userConfig),
  )

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
    transitioning: new Map<string, ConfigUniform>(),
  }

  store.setState({
    container,
    instance: voroforce(container, config) as UnsafeVoroforceInstance,
    config,
    configUniforms,
  })
  initVoroforceIntegration()
}
