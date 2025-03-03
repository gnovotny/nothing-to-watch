import { store, VOROFORCE_MODES } from '../store'
import { baseLatticeConfig, forceSimulationStepConfigs } from '√/config'
import {
  updateUniforms,
  updateUniformsByMode,
  type VoroforceCell,
} from '../utils'

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

  // if (mode === VOROFORCE_MODES.select) {
  //   // renderer.resizeScissor({
  //   //   offset: {
  //   //     left: 0,
  //   //     top: 0,
  //   //   },
  //   // })
  //   // controls.disableFocus()
  //
  //   updateUniforms(
  //     mainUniforms,
  //     {
  //       fEdgeMod: 5,
  //       fEdgeSmoothnessMod: 3,
  //       fRoundnessMod: 3,
  //     },
  //     animatingUniforms,
  //   )
  //   updateUniforms(
  //     postUniforms,
  //     {
  //       fAlphaStrength: 1,
  //       fEdgeStrength: 1,
  //     },
  //     animatingUniforms,
  //   )
  // } else if (mode === VOROFORCE_MODES.preview) {
  //   // controls.enableFocus()
  //
  //   updateUniforms(
  //     mainUniforms,
  //     {
  //       fEdgeMod: 1,
  //       fEdgeSmoothnessMod: 1,
  //       fRoundnessMod: 1,
  //     },
  //     animatingUniforms,
  //   )
  //   updateUniforms(
  //     postUniforms,
  //     {
  //       fAlphaStrength: 0.3,
  //       fEdgeStrength: 0.3,
  //     },
  //     animatingUniforms,
  //   )
  // }

  updateUniformsByMode(mainUniforms, mode, animatingUniforms)
  updateUniformsByMode(postUniforms, mode, animatingUniforms)

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
  const { mode: initialMode, instance, config } = store.getState()

  if (initialMode === VOROFORCE_MODES.intro) {
    setTimeout(() => {
      instance.config.lattice = {
        rows: instance.config.lattice.rows,
        cols: instance.config.lattice.cols,
        ...baseLatticeConfig,
      }
      instance.resize()
      // handleModeChange(VOROFORCE_MODES.preview)
      console.log('innit')
    }, 1000)
  }

  instance.controls.addEventListener('selected', (async ({
    cell,
  }: { cell: VoroforceCell }) => {
    const mode = store.getState().mode
    if (mode === VOROFORCE_MODES.intro) return
    const newMode = cell ? VOROFORCE_MODES.select : VOROFORCE_MODES.preview
    if (newMode === mode) return
    handleModeChange(newMode)
  }) as unknown as EventListener)
}
