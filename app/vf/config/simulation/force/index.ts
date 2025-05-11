import { introForceSimulationStepConfig } from './intro-force'
import { previewForceSimulationStepConfig } from './preview-force'
import { selectForceSimulationStepConfig } from './select-force'
import { VOROFORCE_MODE } from '../../../types'

export const forceSimulationStepConfigs = {
  [VOROFORCE_MODE.preview]: previewForceSimulationStepConfig,
  [VOROFORCE_MODE.select]: selectForceSimulationStepConfig,
  [VOROFORCE_MODE.intro]: introForceSimulationStepConfig,
}
