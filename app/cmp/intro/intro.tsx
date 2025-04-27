import { useState } from 'react'

import { cn } from '@/utl/tw'
import { store } from '@/store'

export const Intro = () => {
  const played = store((state) => state.playedIntro)

  const [initiallyPlayed] = useState(played)
  if (initiallyPlayed) return null

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-50 flex h-dvh w-full items-center justify-center bg-background px-12 transition-opacity duration-700',
        {
          'opacity-0': played,
        },
      )}
    >
      <h1 className='text-center font-black text-3xl italic leading-none lg:text-5xl'>
        There's nothing to{' '}
        <span className='relative'>
          watch
          <span className='absolute bottom-0 left-full after:animate-ellipsis' />
        </span>
      </h1>
    </div>
  )
}
