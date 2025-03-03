import { useEffect, useState } from 'react'
import { cn } from '../../lib/utils/tw'
import { useVoroforce } from '../../lib/voroforce'

export const Intro = () => {
  const played = useVoroforce((state) => state.playedIntro)
  const setPlayed = useVoroforce((state) => state.setPlayedIntro)

  const [initiallyPlayed] = useState(played)

  useEffect(() => {
    if (!played) {
      setTimeout(() => setPlayed(true), 1000)
    }
  }, [played, setPlayed])

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
      <h1 className='font-black text-3xl italic leading-none lg:text-5xl'>
        "
        <span className='after:inline-block after:animate-ellipsis'>
          There's nothing to watch
        </span>
        "
      </h1>
    </div>
  )
}
