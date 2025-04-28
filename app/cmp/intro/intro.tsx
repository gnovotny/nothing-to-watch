import { useEffect, useState } from 'react'

import { cn } from '@/utl/tw'
import { store } from '@/store'
import { PresetSelector } from '../common/preset-selector'
import { useShallow } from 'zustand/react/shallow'

export const Intro = () => {
  const { playedIntro, preset } = store(
    useShallow((state) => ({
      playedIntro: state.playedIntro,
      preset: state.preset,
    })),
  )

  const [noRender, setNoRender] = useState(playedIntro && Boolean(preset))

  useEffect(() => {
    if (playedIntro && Boolean(preset)) {
      setTimeout(() => {
        setNoRender(true)
      }, 1000)
    }
  }, [playedIntro, preset])
  if (noRender) return null

  return (
    <div
      className={cn(
        'fixed inset-x-0 top-0 z-60 flex h-dvh w-full flex-col items-center justify-between bg-background px-12 transition-opacity duration-700',
        {
          'opacity-0': playedIntro && Boolean(preset),
        },
      )}
    >
      <div className='h-1/3'>&nbsp;</div>
      <div className='flex h-1/3 flex-col items-center justify-center'>
        <h1 className='text-center font-black text-3xl italic leading-none lg:text-5xl lg:leading-none'>
          <span className='inline-flex'>"There's nothing</span>{' '}
          <span className='relative inline-flex'>
            to watch"
            <span className='absolute bottom-0 left-full after:animate-ellipsis' />
          </span>
        </h1>
      </div>
      <div className='flex h-1/3 justify-center'>
        <PresetSelector />
      </div>
    </div>
  )
}
