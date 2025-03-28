import { store, VOROFORCE_MODES } from '../store'
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
    if (store.getState().mode !== VOROFORCE_MODES.preview) return
    if (cell) setFilm(await getCellFilm(cell, filmBatches))
  }) as unknown as EventListener)

  controls.addEventListener('selected', (async ({
    cell,
  }: { cell: VoroforceCell }) => {
    if (store.getState().mode !== VOROFORCE_MODES.select) return
    if (cell) setFilm(await getCellFilm(cell, filmBatches))
  }) as unknown as EventListener)
}
