import { store } from '../store'
import type { VoroforceCell } from '../utils/cells'
import { getCellFilm } from '../utils'

export const handleControls = () => {
  const {
    setFilm,
    instance: { controls },
    filmBatches,
  } = store.getState()

  // controls.addEventListener('pointerMove', ({ pointer }) => {})
  controls.addEventListener('focused', (async ({
    cell,
  }: { cell: VoroforceCell }) => {
    if (cell) setFilm(await getCellFilm(cell, filmBatches))
  }) as unknown as EventListener)
}
