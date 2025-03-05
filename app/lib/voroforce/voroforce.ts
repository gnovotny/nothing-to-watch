import voroforce from '√/lib'

import { initVoroforceIntegrations } from './integrations'
import { type VoroforceInstance, store } from './store'
import { getVoroforceConfigProps } from './utils'

export const createVoroforce = (container: HTMLElement) => {
  const configProps = getVoroforceConfigProps(store.getState())
  store.setState({
    container,
    instance: voroforce(container, configProps.config) as VoroforceInstance,
    ...configProps,
  })
  initVoroforceIntegrations()
}
