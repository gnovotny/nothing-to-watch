import { store } from '../store'
import { getCellFilm, type VoroforceCell } from '../utils'

export const handleControls = () => {
  const {
    setFilm,
    instance: { controls },
    filmBatches,
  } = store.getState()

  controls.addEventListener('focused', (async ({
    cell,
  }: { cell: VoroforceCell }) => {
    if (cell) setFilm(await getCellFilm(cell, filmBatches))
  }) as unknown as EventListener)

  controls.addEventListener('selected', (async ({
    cell,
  }: { cell: VoroforceCell }) => {
    // if (store.getState().mode !== VOROFORCE_MODES.select) return
    controls.freezePointerUntilBlurAndRefocus()
    if (cell) setFilm(await getCellFilm(cell, filmBatches))
  }) as unknown as EventListener)
}
