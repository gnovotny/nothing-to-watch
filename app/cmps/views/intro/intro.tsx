import { useShallowState } from '../../../store'
import { cn } from '../../../utils/tw'
import { safeInitVoroforce } from '../../../vf'
import { FadeTransition } from '../../common/fade-transition'
import { useMediaQuery } from '../../../hooks/use-media-query'
import { down } from '../../../utils/mq'
import { isDefined } from '../../../utils/misc'
import { CoreSettingsWidget } from '../../common/core-settings/core-settings-widget'
import { DeviceClassWidget } from '../../common/device-class/device-class-widget'
import { SmallScreenWarning } from '../../common/small-screen-warning'

const MoviesDatasetLicenseInfo = () => (
  <span className='inline-flex text-xxs text-zinc-600 leading-none dark:text-zinc-300'>
    Contains information from Kaggle's "Full TMDB Movies Dataset" which is made
    available under the ODC Attribution License.
  </span>
)

export const Intro = () => {
  const { visible, preset, hasDeviceClass } = useShallowState((state) => ({
    visible: !(state.playedIntro && Boolean(state.preset)),
    preset: state.preset,
    hasDeviceClass: isDefined(state.deviceClass),
  }))

  const isSmallScreen = useMediaQuery(down('md'))

  // const [isMounted, setIsMounted] = useState(false)
  // useEffect(() => {
  //   setTimeout(() => {
  //     setIsMounted(true)
  //   }, 300)
  // }, [])

  return (
    <FadeTransition
      className={cn(
        'fixed inset-x-0 top-0 z-60 flex h-dvh w-full justify-center bg-background px-12',
      )}
      visible={visible}
      // visible={visible || !isMounted}
      transitionOptions={{
        initialEntered: visible,
        // initialEntered: true,
      }}
    >
      <div className='flex h-full flex-col items-stretch'>
        <div className='h-1/3' />
        <div className='flex h-1/3 flex-col items-center justify-center'>
          <h1 className='font-black text-4xl leading-none md:text-5xl md:leading-none'>
            <span className='inline-flex'>
              <span className='max-md:hidden'>"</span>
              <i>There's nothing</i>
            </span>{' '}
            <span className='relative inline-flex'>
              <i>to watch</i>
              <span className='max-md:hidden'>"</span>
              <span className='absolute bottom-0 left-full after:animate-ellipsis' />
            </span>
          </h1>
        </div>
        <div className='relative flex h-1/3 flex-col items-stretch justify-end gap-4 pb-12'>
          <FadeTransition
            visible={!isSmallScreen && !hasDeviceClass}
            className='absolute inset-x-0 bottom-12 w-full duration-1000'
            transitionOptions={{
              timeout: 500,
            }}
          >
            <DeviceClassWidget />
            <MoviesDatasetLicenseInfo />
          </FadeTransition>
          <FadeTransition
            visible={hasDeviceClass && (isSmallScreen || !preset)}
            className='absolute inset-x-0 bottom-12 w-full duration-1000'
            transitionOptions={{
              timeout: 500,
            }}
          >
            <SmallScreenWarning />
            <CoreSettingsWidget
              onSubmit={() => {
                setTimeout(() => {
                  void safeInitVoroforce()
                }, 700)
              }}
              submitLabel='Continue'
              submitVisibility='always'
            />
            <MoviesDatasetLicenseInfo />
          </FadeTransition>
        </div>
      </div>
    </FadeTransition>
  )
}
