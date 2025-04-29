import { cn } from '@/utl/tw'
import { store } from '@/store'
import { PresetSelector } from '../common/preset-selector'
import { useShallow } from 'zustand/react/shallow'
import { FadeTransition } from '../common/transition'

export const Intro = () => {
  const visible = store(
    useShallow((state) => !(state.playedIntro && Boolean(state.preset))),
  )

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
        <PresetSelector />
      </div>
    </FadeTransition>
  )
}
