import { useState } from 'react'
import { cn } from '../../utils/tw'
import { useVoroforce } from '../../voroforce'

export const Intro = () => {
  const played = useVoroforce((state) => state.playedIntro)

  const [initiallyPlayed] = useState(played)
  if (initiallyPlayed) return null

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-50 flex h-dvh w-full items-center justify-center bg-background transition-opacity duration-700',
        {
          'opacity-0': played,
        },
      )}
    >
      <h1 className='relative font-black text-3xl italic leading-none lg:text-5xl'>
        There's nothing to watch
        <span className='absolute bottom-0 left-full after:animate-ellipsis' />
      </h1>
    </div>
  )
}
