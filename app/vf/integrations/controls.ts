import { store } from '../../store'
import { VOROFORCE_MODE } from '../consts'
import { type VoroforceCell, getCellFilm } from '../utils'
import type { VoroforceInstance } from '../types'
import controlsConfig, { controlModeConfigs } from '../config/controls/controls'
import { mergeConfigs } from '√'

export const handleControls = () => {
  const {
    setFilm,
    voroforce: { controls },
    filmBatches,
    configUniforms: { main: mainUniforms, animating: animatingUniforms },
    mode,
  } = store.getState()

  controls.listen('focused', (async ({ cell }: { cell: VoroforceCell }) => {
    if (cell) setFilm(await getCellFilm(cell, filmBatches))
  }) as unknown as EventListener)

  controls.listen('selected', (async ({ cell }: { cell: VoroforceCell }) => {
    // if (store.getState().mode !== VOROFORCE_MODES.select) return
    if (cell) {
      setFilm(await getCellFilm(cell, filmBatches))
      controls.pinPointer()
    } else {
      controls.unpinPointer()
    }
  }) as unknown as EventListener)

  controls.listen('pointerFrozenChange', (async ({
    frozen,
  }: { frozen: boolean }) => {
    const uniformKey = 'fUnweightedEffectMod'
    const uniform = mainUniforms.get(uniformKey)
    if (!uniform) return
    const value =
      [VOROFORCE_MODE.preview, VOROFORCE_MODE.select].includes(mode) && frozen
        ? 1
        : 0
    if (animatingUniforms && uniform.animatable) {
      if (uniform.value !== value) {
        uniform.targetValue = value
        if (!animatingUniforms.has(uniformKey)) {
          animatingUniforms.set(uniformKey, uniform)
        }
      }
    } else {
      uniform.value = value
    }
  }) as unknown as EventListener)
}

export const updateControlsByMode = (
  controls: VoroforceInstance['controls'],
  mode: VOROFORCE_MODE,
) => {
  controls.updateConfig(
    mergeConfigs(
      controlsConfig,
      controlModeConfigs[mode] ? controlModeConfigs[mode] : {},
    ),
  )
}
