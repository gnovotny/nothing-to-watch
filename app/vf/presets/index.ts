import { default as high } from './high'
import { default as low } from './low'
import { default as lowPrototyping } from './low-prototyping'
import { default as mid } from './mid'
import { default as mobile } from './mobile'

import { VOROFORCE_PRESET } from '../consts'

const presets = {
  [VOROFORCE_PRESET.mobile]: mobile,
  [VOROFORCE_PRESET.minimal]: low,
  [VOROFORCE_PRESET.minimalPrototyping]: lowPrototyping,
  [VOROFORCE_PRESET.contours]: mid,
  [VOROFORCE_PRESET.depth]: high,
}

export default presets
