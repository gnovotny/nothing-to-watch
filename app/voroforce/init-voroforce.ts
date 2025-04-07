import voroforce from '√/index'

import { initVoroforceIntegrations } from './integrations'
import { type VoroforceInstance, store } from './store'
import { getVoroforceConfigProps } from './utils'

export const initVoroforce = async (container: HTMLElement) => {
  const configProps = await getVoroforceConfigProps(store.getState())
  store.setState({
    container,
    instance: voroforce(container, configProps.config) as VoroforceInstance,
    ...configProps,
  })
  initVoroforceIntegrations()
}
