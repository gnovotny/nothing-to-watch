import { useShallowState } from '@/store'
import { TabletSmartphone, TriangleAlert } from 'lucide-react'
import { cn } from '../../utls/tw'
import { safeInitVoroforce } from '../../vf'
import { FadeTransition } from '../common/fade-transition'
import { DeviceClassSelector } from '../common/device-class-selector'
import { useMediaQuery } from '../../hks/use-media-query'
import { down } from '../../utls/mq'
import { isDefined } from '../../utls/misc'
import { CoreSettingsWidget } from '../common/core-settings-widget'
const LegalInfo = () => (
  <span className='inline-flex text-xxs text-zinc-600 leading-none dark:text-zinc-300'>
    Contains information from Kaggle's "Full TMDB Movies Dataset" which is made
    available under the ODC Attribution License.
  </span>
)

export const Intro = () => {
  const { visible, preset, deviceClass } = useShallowState((state) => ({
    visible: !(state.playedIntro && Boolean(state.preset)),
    preset: state.preset,
    deviceClass: state.deviceClass,
  }))

  const isSmallScreen = useMediaQuery(down('md'))

  return (
    <FadeTransition
      className={cn(
        'fixed inset-x-0 top-0 z-60 flex h-dvh w-full justify-center bg-background px-12',
      )}
      visible={visible}
      transitionOptions={{
        initialEntered: visible,
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
            visible={!isSmallScreen && !isDefined(deviceClass)}
            // notEnteredClassName='absolute inset-x-0 bottom-12'
            className='absolute inset-x-0 bottom-12 w-full duration-1000'
            transitionOptions={{
              timeout: 500,
            }}
          >
            <div className='flex items-center gap-2 font-semibold text-xl text-zinc-900 dark:text-white'>
              <TabletSmartphone className='h-5 w-5 text-zinc-900 dark:text-white' />
              Your device
            </div>
            <DeviceClassSelector />
            <LegalInfo />
          </FadeTransition>
          <FadeTransition
            visible={isDefined(deviceClass) && (isSmallScreen || !preset)}
            className='absolute inset-x-0 bottom-12 w-full duration-1000'
            transitionOptions={{
              timeout: 500,
            }}
          >
            <div className='flex flex-col gap-2 py-4 md:hidden'>
              <div className='flex items-center gap-2 font-semibold text-xl text-zinc-900 dark:text-white'>
                <TriangleAlert className='h-5 w-5 text-amber-500 ' />
                <div>Warning</div>
              </div>
              <p className='text-base text-zinc-600 leading-tight dark:text-zinc-300'>
                This page is best viewed on a larger device like a desktop or
                laptop.
              </p>
            </div>
            <CoreSettingsWidget
              onSubmit={() => {
                setTimeout(() => {
                  void safeInitVoroforce()
                }, 700)
              }}
              submitLabel='Continue'
              submitVisibility='always'
            />
            <LegalInfo />
          </FadeTransition>
        </div>
      </div>
    </FadeTransition>
  )
}
