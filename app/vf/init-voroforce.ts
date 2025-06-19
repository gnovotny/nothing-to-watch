import voroforce from '√/index'

import { store } from '../store'
import { initVoroforceIntegrations } from './integrations'
import type { VoroforceInstance } from './types'
import { getVoroforceConfigProps } from './utils'

export const initVoroforce = async (container: HTMLElement) => {
  const state = store.getState()
  const { config, configUniforms } = await getVoroforceConfigProps(state)
  if (state.preset) {
    store.setState({
      container,
      voroforce: voroforce(container, config) as VoroforceInstance,
      config,
      configUniforms,
    })
    initVoroforceIntegrations()
  }
}

export const safeInitVoroforce = async () => {
  try {
    // biome-ignore lint/style/noNonNullAssertion: exists
    await initVoroforce(document.getElementById('voroforce')!)
  } catch (e) {
    console.error(e)
    alert((e as Error).message)
  }
}
