import { store } from '../store'

export const revealVoroforceContainer = () => {
  store.getState().container.classList.remove('opacity-0')
}

export const handleIntro = () => {
  const { playedIntro } = store.getState()

  if (playedIntro) {
    revealVoroforceContainer()
  } else {
    store.subscribe((state) => state.playedIntro, revealVoroforceContainer)
  }
}
