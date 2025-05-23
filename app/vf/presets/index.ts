import { default as mobile } from './mobile'
import { default as low } from './low'
import { default as lowPrototyping } from './low-prototyping'
import { default as mid } from './mid'
import { default as high } from './high'

import { VOROFORCE_PRESET } from '../consts'

const presets = {
  [VOROFORCE_PRESET.mobile]: mobile,
  [VOROFORCE_PRESET.low]: low,
  [VOROFORCE_PRESET.lowPrototyping]: lowPrototyping,
  [VOROFORCE_PRESET.mid]: mid,
  [VOROFORCE_PRESET.high]: high,
}

export default presets
