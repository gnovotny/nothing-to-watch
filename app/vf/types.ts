import type voroforce from '√'

type SafeVoroforceInstance = ReturnType<typeof voroforce>
export type VoroforceInstance = SafeVoroforceInstance & {
  ticker: NonNullable<SafeVoroforceInstance['ticker']>
  loader: NonNullable<SafeVoroforceInstance['loader']>
  controls: NonNullable<SafeVoroforceInstance['controls']>
  display: NonNullable<SafeVoroforceInstance['display']> & {
    scene: NonNullable<NonNullable<SafeVoroforceInstance['display']>['scene']>
    renderer: NonNullable<
      NonNullable<SafeVoroforceInstance['display']>['renderer']
    >
  }
  simulation: NonNullable<SafeVoroforceInstance['simulation']>
  dimensions: NonNullable<SafeVoroforceInstance['dimensions']>
}

export enum VOROFORCE_MODE {
  preview = 0,
  select = 1,
  intro = 2,
}

export const DEFAULT_VOROFORCE_MODE: VOROFORCE_MODE = VOROFORCE_MODE.preview

export enum VOROFORCE_PRESET {
  mobile = 'mobile',
  low = 'low',
  mid = 'mid',
  high = 'high',
}
