import { forceSimulationStepIntroConfig } from './intro'
import { forceSimulationStepPreviewConfig } from './preview'
import { forceSimulationStepSelectConfig } from './select'
import { VOROFORCE_MODE } from '../../../types'

export const forceSimulationStepConfigs = {
  [VOROFORCE_MODE.preview]: forceSimulationStepPreviewConfig,
  [VOROFORCE_MODE.select]: forceSimulationStepSelectConfig,
  [VOROFORCE_MODE.intro]: forceSimulationStepIntroConfig,
}
