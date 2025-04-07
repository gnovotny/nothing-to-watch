import { baseLatticeConfig, forceSimulationStepConfigs } from '../config/base'
import { VOROFORCE_MODE, store } from '../store'
import { type VoroforceCell, updateUniformsByMode } from '../utils'

export const revealVoroforceContainer = () => {
  store.getState().container.classList.remove('opacity-0')
}

let afterModeChangeTimeout: NodeJS.Timeout

const handleModeChange = (mode: VOROFORCE_MODE): void => {
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

  if (mode === VOROFORCE_MODE.select) {
    // renderer.resizeScissor({
    //   offset: {
    //     left: 0,
    //     top: 0,
    //   },
    // })
    // controls.disableFocus()
    // controls.freezePointerUntilBlurAndRefocus()
  } else if (mode === VOROFORCE_MODE.preview) {
    // controls.enableFocus()
  }

  updateUniformsByMode(mainUniforms, mode, animatingUniforms)
  updateUniformsByMode(postUniforms, mode, animatingUniforms)

  // when switching modes, need to temporarily up the neighbor searches in the shader to max supported level (voronoi cell propagation speed limits in shader)
  // updateUniforms(mainUniforms, {
  //   // bForceMaxQuality: true,
  //   iForceMaxNeighborLevel: 3,
  // })

  simulation.updateForceStepConfig(forceStepConfig)

  clearTimeout(afterModeChangeTimeout)
  afterModeChangeTimeout = setTimeout(() => {
    // we revert back to default neighbor level as using max is extremely expensive
    // updateUniforms(mainUniforms, {
    //   // bForceMaxQuality: false,
    //   iForceMaxNeighborLevel: 0,
    // })

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
const handleIntro = () => {
  const { instance, setPlayedIntro } = store.getState()

  const { controls, dimensions } = instance

  // revealVoroforceContainer()
  // setPlayedIntro(true)
  // return
  setTimeout(() => {
    instance.config.lattice = {
      rows: instance.config.lattice.rows,
      cols: instance.config.lattice.cols,
      ...baseLatticeConfig,
    }
    instance.resize()

    revealVoroforceContainer()
    setPlayedIntro(true)

    setTimeout(() => {
      handleModeChange(VOROFORCE_MODE.preview)

      controls.targetPointer = {
        x:
          dimensions.get('width') / 2 +
          (0.5 - Math.random()) * 0.05 * dimensions.get('width'),
        y:
          dimensions.get('height') / 2 +
          (0.5 - Math.random()) * 0.05 * dimensions.get('height'),
      }
    }, 3000)
  }, 1000)
}

export const handleMode = () => {
  const { mode: initialMode, instance, config } = store.getState()

  const { loader, ticker } = instance

  if (initialMode === VOROFORCE_MODE.intro) {
    if (config.media.enabled && loader.loadingMediaLayers !== 0) {
      loader.addEventListener(
        'idle',
        () => {
          // media will be uploaded to gpu on next tick
          ticker.addEventListener(
            'tick',
            () => {
              handleIntro()
            },
            { once: true },
          )
        },
        { once: true },
      )
    } else {
      handleIntro()
    }
  } else {
    if (config.media.enabled && config.media.preload) {
      loader.addEventListener(
        'preloaded',
        () => {
          // media will be uploaded to gpu on next tick
          ticker.addEventListener(
            'tick',
            () => {
              revealVoroforceContainer()
            },
            { once: true },
          )
        },
        { once: true },
      )
    } else {
      revealVoroforceContainer()
    }
  }

  instance.controls.addEventListener('selected', (async ({
    cell,
  }: { cell: VoroforceCell }) => {
    const mode = store.getState().mode
    if (mode === VOROFORCE_MODE.intro) return
    const newMode = cell ? VOROFORCE_MODE.select : VOROFORCE_MODE.preview
    if (newMode === mode) return
    handleModeChange(newMode)
  }) as unknown as EventListener)
}
