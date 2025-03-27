import { store } from '../store'

export const revealVoroforceContainer = () => {
  store.getState().container.classList.remove('opacity-0')
}

export const handleIntro = () => {
  const {
    playedIntro,
    instance: { loader, ticker },
    config,
  } = store.getState()

  if (playedIntro) {
    if (config.media.enabled && config.media.preload) {
      loader.addEventListener('preloaded', () => {
        // media will be uploaded to gpu on next tick
        ticker.addEventListener(
          'tick',
          () => {
            revealVoroforceContainer()
          },
          { once: true },
        )
      })
    } else {
      revealVoroforceContainer()
    }
  } else {
    store.subscribe(
      (state) => state.playedIntro,
      () => {
        if (config.media.enabled && loader.loadingMediaLayers !== 0) {
          loader.addEventListener('idle', () => {
            // media will be uploaded to gpu on next tick
            ticker.addEventListener(
              'tick',
              () => {
                revealVoroforceContainer()
              },
              { once: true },
            )
          })
        } else {
          revealVoroforceContainer()
        }
      },
    )
  }
}
