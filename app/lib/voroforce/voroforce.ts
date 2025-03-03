import voroforce from '√/lib'

import { store, type UnsafeVoroforceInstance } from './store'
import { getVoroforceConfigProps } from './utils'
import { initVoroforceIntegrations } from './integrations'

export const createVoroforce = (container: HTMLElement) => {
  const configProps = getVoroforceConfigProps(store.getState().userConfig)
  store.setState({
    container,
    instance: voroforce(
      container,
      configProps.config,
    ) as UnsafeVoroforceInstance,
    ...configProps,
  })
  initVoroforceIntegrations()
}
