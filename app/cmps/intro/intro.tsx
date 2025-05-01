import { cn } from '../../utls/tw'
import { useShallowState } from '@/store'
import { PresetSelector } from '../common/preset-selector'
import { FadeTransition } from '../common/transition'
import { safeInitVoroforce } from '../../vf'
import { Settings, TriangleAlert } from 'lucide-react'

export const Intro = () => {
  const { visible, preset } = useShallowState((state) => ({
    visible: !(state.playedIntro && Boolean(state.preset)),
    preset: state.preset,
  }))

  return (
    <FadeTransition
      className={cn(
        'fixed inset-x-0 top-0 z-60 flex h-dvh w-full flex-col items-center justify-between bg-background px-12',
      )}
      visible={visible}
      transitionOptions={{
        initialEntered: visible,
      }}
    >
      <div className='h-1/3'>&nbsp;</div>
      <div className='flex h-1/3 flex-col items-center justify-center'>
        <h1 className='font-black text-4xl leading-none md:text-4xl lg:text-5xl lg:leading-none'>
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
      <div className='flex h-1/3 justify-center'>
        <FadeTransition visible={!preset}>
          <div className='hidden md:block'>
            <div className='flex items-center gap-2 font-semibold text-xl text-zinc-900 dark:text-white'>
              <Settings className='h-5 w-5 text-zinc-900 dark:text-white' />
              What best describes the device you're using?
            </div>
            <p className='text-sm text-zinc-600 dark:text-zinc-300'>
              You can change this later
            </p>
          </div>
          <div className='flex flex-col gap-2 py-4 md:hidden'>
            <div className='flex items-center gap-2 font-semibold text-xl text-zinc-900 dark:text-white'>
              <TriangleAlert className='h-5 w-5 text-amber-500 ' />
              <div>Warning</div>
            </div>
            <p className='text-base text-zinc-600 dark:text-zinc-300'>
              This page is best viewed on a larger device like a desktop or
              laptop.
            </p>
          </div>
          <PresetSelector onSetPreset={() => void safeInitVoroforce()} />
          <span className='inline-flex text-xxs text-zinc-600 leading-none dark:text-zinc-300'>
            Contains information from Kaggle's "Full TMDB Movies Dataset" which
            is made available under the ODC Attribution License.
          </span>
        </FadeTransition>
      </div>
    </FadeTransition>
  )
}
