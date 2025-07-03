import { default as high } from './depth'
import { default as low } from './minimal'
// import { default as lowPrototyping } from './low-prototyping'
import { default as mid } from './contours'
import { default as mobile } from './mobile'

import { VOROFORCE_PRESET } from '../consts'

const presets = {
  [VOROFORCE_PRESET.mobile]: mobile,
  [VOROFORCE_PRESET.minimal]: low,
  // [VOROFORCE_PRESET.minimalPrototyping]: lowPrototyping,
  [VOROFORCE_PRESET.contours]: mid,
  [VOROFORCE_PRESET.depth]: high,
}

export default presets
