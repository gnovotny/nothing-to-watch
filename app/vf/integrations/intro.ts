import { store } from '../../store'

export const revealVoroforceContainer = () => {
  store.getState().container.classList.remove('opacity-0')
}

export const handleIntro = () => {
  const {
    playedIntro,
    voroforce: { loader, ticker },
    config,
  } = store.getState()

  if (playedIntro) {
    if (config.media.enabled && config.media.preload) {
      loader.listen('preloaded', () => {
        // media will be uploaded to gpu on next tick
        ticker.listenOnce('tick', revealVoroforceContainer)
      })
    } else {
      revealVoroforceContainer()
    }
  } else {
    store.subscribe(
      (state) => state.playedIntro,
      () => {
        if (config.media.enabled && loader.loadingMediaLayers !== 0) {
          loader.listen('idle', () => {
            // media will be uploaded to gpu on next tick
            ticker.listenOnce('tick', revealVoroforceContainer)
          })
        } else {
          revealVoroforceContainer()
        }
      },
    )
  }
}
