import { store } from '../store'
import { getCellFilm } from '../utils'
import type { VoroforceCell } from '../utils/cells'

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
