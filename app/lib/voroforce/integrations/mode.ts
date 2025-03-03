import { store, VOROFORCE_MODES } from '../store'
import { forceSimulationStepConfigs } from '√/config'
import { updateUniforms, type VoroforceCell } from '../utils'

let afterModeChangeTimeout: NodeJS.Timeout

const handleModeChange = (mode: VOROFORCE_MODES): void => {
  const {
    setMode,
    instance: { simulation },
    configUniforms: {
      main: mainUniforms,
      post: postUniforms,
      animating: animatingUniforms,
    },
  } = store.getState()

  setMode(mode)
  const forceStepConfig = forceSimulationStepConfigs[mode]
  // when switching from select to preview mode, need to up velocityDecay during the transition (voronoi cell propagation speed limits in shader)
  forceStepConfig.parameters.velocityDecay =
    forceStepConfig.parameters.velocityDecayTransitionEnterMode

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
        fEdgeMod: 5,
        fEdgeSmoothnessMod: 3,
        fRoundnessMod: 3,
      },
      animatingUniforms,
    )
    updateUniforms(
      postUniforms,
      {
        fAlphaStrength: 1,
        fEdgeStrength: 1,
      },
      animatingUniforms,
    )
  } else if (mode === VOROFORCE_MODES.preview) {
    // controls.enableFocus()

    updateUniforms(
      mainUniforms,
      {
        fEdgeMod: 1,
        fEdgeSmoothnessMod: 1,
        fRoundnessMod: 1,
      },
      animatingUniforms,
    )
    updateUniforms(
      postUniforms,
      {
        fAlphaStrength: 0.3,
        fEdgeStrength: 0.3,
      },
      animatingUniforms,
    )
  }

  // when switching modes, need to temporarily up the neighbor searches in the shader to max supported level (voronoi cell propagation speed limits in shader)
  updateUniforms(mainUniforms, {
    // bForceMaxQuality: true,
    iForceMaxNeighborLevel: 3,
  })

  simulation.updateForceStepConfig(forceStepConfig)

  clearTimeout(afterModeChangeTimeout)
  afterModeChangeTimeout = setTimeout(() => {
    // we revert back to default neighbor level as using max is extremely expensive
    updateUniforms(mainUniforms, {
      // bForceMaxQuality: false,
      iForceMaxNeighborLevel: 0,
    })

    // revert to default velocityDecay after the transition (voronoi cell propagation speed limits in shader, see above)
    forceStepConfig.parameters.velocityDecay =
      forceStepConfig.parameters.velocityDecayBase
    simulation.updateForceStepConfig(forceSimulationStepConfigs[mode])

    // if (mode === 'preview') {
    //   // updateUniforms(mainUniforms, {
    //   //   bForceMaxQuality: false,
    //   //   iForceMaxNeighborLevel: 0,
    //   // })
    // } else {
    //   // renderer.resizeScissor({
    //   //   offset: {
    //   //     [landscape ? 'left' : 'top']: 800, // todo measurement
    //   //   },
    //   // })
    // }
  }, 2000)
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
