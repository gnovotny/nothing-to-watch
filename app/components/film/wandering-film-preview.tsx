import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '../../lib/utils/tw'
import { useVoroforce } from '../../lib/voroforce'
import { FilmPoster } from './shared/film-poster'
import { FilmRatingGauge } from './shared/film-rating-gauge'
import { lerp } from '../../lib/utils/math'
import { Badge } from '../ui/badge'

const WanderingFilmPreview = () => {
  const active = true
  const reverse = false
  const containerRef = useRef<HTMLDivElement>(null)

  const { film, isPreviewMode, voroforce } = useVoroforce(
    useShallow((state) => ({
      film: state.film,
      isPreviewMode: state.isPreviewMode,
      voroforce: state.instance,
    })),
  )

  const position = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const offset = useRef<{ x: number; y: number }>({ x: -250, y: -270 })

  useEffect(() => {
    const { ticker, controls } = voroforce

    position.current = { x: controls.prevX, y: controls.prevY }
    const onTick = () => {
      if (!containerRef.current) return
      position.current.x = lerp(
        position.current.x,
        controls.prevX + offset.current.x,
        0.1,
      )
      position.current.y = lerp(
        position.current.y,
        controls.prevY + offset.current.y,
        0.1,
      )
      containerRef.current.style.translate = `${position.current.x}px ${position.current.y}px`
    }
    ticker.addEventListener('tick', onTick)

    return () => {
      ticker.removeEventListener('tick', onTick)
    }
  }, [voroforce])

  return (
    <>
      {isPreviewMode && film && (
        <div
          ref={containerRef}
          className={cn(
            'pointer-events-none absolute top-0 left-0 z-10 flex w-300 max-w-full flex-row gap-6 p-6 opacity-0 transition-opacity duration-300 will-change-transform lg:max-w-[80%] lg:gap-9 lg:p-9',
            {
              'right-0 left-auto flex-row-reverse': reverse,
              '!opacity-100': active,
            },
          )}
        >
          <FilmPoster
            film={film}
            className={cn(
              'w-full max-w-[150px] shrink-0 basis-1/4 rounded-2xl lg:max-w-[300px] lg:basis-1/4',
              {
                'pointer-events-auto': active,
              },
            )}
            // onPointerOver={onPointerOver}
          />
          <div
            className={cn(
              'flex basis-3/4 flex-col gap-3 lg:justify-start lg:gap-6',
              {
                'items-end text-right': reverse,
              },
            )}
          >
            <p className='landscape:line-clamp- line-clamp-2 font-medium text-base text-foreground/90 leading-none lg:line-clamp-1 lg:h-[1.25rem] lg:text-xl lg:leading-none landscape:h-[1rem] lg:landscape:h-[1.25rem]'>
              {film.tagline}
            </p>
            <h3 className='line-clamp-2 h-[3.75rem] font-black text-3xl lg:line-clamp-1 lg:h-[3rem] lg:text-5xl landscape:line-clamp-1 landscape:h-[1.875rem] lg:landscape:h-[3rem]'>
              {film.title}
              <span className='font-normal text-foreground/50'>
                &nbsp;({film.year})
              </span>
            </h3>
            <div className='flex flex-row gap-3 pt-2'>
              {film.genres?.map((genre) => (
                <Badge key={genre}>{genre}</Badge>
              ))}
            </div>
            <FilmRatingGauge value={film.rating} />
          </div>
        </div>
      )}
    </>
  )
}

export default WanderingFilmPreview
