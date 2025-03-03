import { easedMinLerp, MIN_LERP_EASING_TYPES } from './math'

export type ConfigUniform =
  | {
      value: string | boolean
      targetValue: never
      targetFactor: never
      targetEasing: never
    }
  | {
      value: number
      targetValue?: number
      targetFactor?: number
      targetEasing?: MIN_LERP_EASING_TYPES
    }
export type ConfigUniforms = Map<string, ConfigUniform>

export const handleTransitioningUniforms = (uniforms: ConfigUniforms) => {
  uniforms.forEach((uniform, key) => {
    if (
      typeof uniform.value === 'number' &&
      typeof uniform.targetValue === 'number'
    ) {
      uniform.value = easedMinLerp(
        uniform.value,
        uniform.targetValue,
        uniform.targetFactor ?? 0.025,
        uniform.targetEasing ?? MIN_LERP_EASING_TYPES.linear,
      )
      if (uniform.value === uniform.targetValue) {
        uniform.targetValue = undefined
        uniform.targetFactor = undefined
        uniforms.delete(key)
        console.log('done')
      }
    }
  })
}

export const updateUniforms = (
  uniforms: ConfigUniforms,
  updates: Record<string, number | boolean>,
  transitioningUniforms: ConfigUniforms,
) => {
  Object.entries(updates).forEach(([key, value]) => {
    const uniform = uniforms.get(key)
    if (uniform) {
      if (typeof value === 'number') {
        if (uniform.value !== value) {
          uniform.targetValue = value
          if (!transitioningUniforms.has(key)) {
            transitioningUniforms.set(key, uniform)
          }
        }
      } else {
        uniform.value = value
      }
    }
  })
}
