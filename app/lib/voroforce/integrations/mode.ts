import { store, VOROFORCE_MODES } from '../store'
import type { VoroforceCell } from '../utils/cells'
import { forceSimulationStepConfigs } from '√/config'
import { updateUniforms } from '../utils'

let afterModeChangeTimeout: NodeJS.Timeout

const handleModeChange = (mode: VOROFORCE_MODES): void => {
  const {
    setMode,
    instance: {
      simulation,
      controls,
      // display: { scene },
    },
    configUniforms: {
      main: mainUniforms,
      post: postUniforms,
      transitioning: transitioningUniforms,
    },
  } = store.getState()

  setMode(mode)

  if (mode === VOROFORCE_MODES.select) {
    // renderer.resizeScissor({
    //   offset: {
    //     left: 0,
    //     top: 0,
    //   },
    // })
    // controls.disableFocus()

    updateUniforms(
      mainUniforms,
      {
        fEdgeMode: 5,
        fEdgeSmoothnessMod: 3,
        fRoundnessMod: 3,
      },
      transitioningUniforms,
    )
    updateUniforms(
      postUniforms,
      {
        fAlphaStrength: 1,
        fEdgeStrength: 1,
      },
      transitioningUniforms,
    )
  } else {
    controls.enableFocus()

    updateUniforms(
      mainUniforms,
      {
        fEdgeMode: 1,
        fEdgeSmoothnessMod: 1,
        fRoundnessMod: 1,
      },
      transitioningUniforms,
    )
    updateUniforms(
      postUniforms,
      {
        fAlphaStrength: 0.3,
        fEdgeStrength: 0.3,
      },
      transitioningUniforms,
    )
  }

  updateUniforms(
    mainUniforms,
    {
      bForceMaxQuality: true,
    },
    transitioningUniforms,
  )

  clearTimeout(afterModeChangeTimeout)
  afterModeChangeTimeout = setTimeout(() => {
    if (mode === 'preview') {
      updateUniforms(
        mainUniforms,
        {
          bForceMaxQuality: false,
        },
        transitioningUniforms,
      )
    } else {
      // renderer.resizeScissor({
      //   offset: {
      //     [landscape ? 'left' : 'top']: 800, // todo measurement
      //   },
      // })
    }
  }, 1000)

  simulation.updateForceStepConfig(forceSimulationStepConfigs[mode])
}

export const handleMode = () => {
  const {
    instance: { controls },
  } = store.getState()

  controls.addEventListener('selected', (async ({
    cell,
  }: { cell: VoroforceCell }) => {
    const mode = cell ? VOROFORCE_MODES.select : VOROFORCE_MODES.preview
    if (mode !== store.getState().mode) {
      handleModeChange(mode)
    }
  }) as unknown as EventListener)
}
