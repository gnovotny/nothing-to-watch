import voroforce from '√/lib'

import { store, type VoroforceInstance } from './store'
import { getVoroforceConfigProps } from './utils'
import { initVoroforceIntegrations } from './integrations'

export const createVoroforce = (container: HTMLElement) => {
  const configProps = getVoroforceConfigProps(store.getState())
  store.setState({
    container,
    instance: voroforce(container, configProps.config) as VoroforceInstance,
    ...configProps,
  })
  initVoroforceIntegrations()
}
