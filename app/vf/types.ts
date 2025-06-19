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
