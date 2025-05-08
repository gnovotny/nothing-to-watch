import { store } from '../../store'
import { getCellFilm, type VoroforceCell } from '../utils'

export const handleControls = () => {
  const {
    setFilm,
    voroforce: { controls },
    filmBatches,
  } = store.getState()

  controls.listen('focused', (async ({ cell }: { cell: VoroforceCell }) => {
    if (cell) setFilm(await getCellFilm(cell, filmBatches))
  }) as unknown as EventListener)

  controls.listen('selected', (async ({ cell }: { cell: VoroforceCell }) => {
    // if (store.getState().mode !== VOROFORCE_MODES.select) return

    if (cell) {
      setFilm(await getCellFilm(cell, filmBatches))
      controls.freezePointerUntilBlurAndRefocus()
    } else {
      controls.unfreezePointer()
    }
  }) as unknown as EventListener)
}
