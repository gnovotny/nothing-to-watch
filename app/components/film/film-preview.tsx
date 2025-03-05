import { type PointerEventHandler, useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '../../lib/utils/tw'
import { type Film, useVoroforce } from '../../lib/voroforce'
import { FilmPoster } from './shared/film-poster'
import { FilmRatingGauge } from './shared/film-rating-gauge'

const FilmPreviewMirrorItem = ({
  film,
  reverse = false,
  active = false,
  onPointerOver,
}: {
  film: Film
  reverse?: boolean
  active?: boolean
  onPointerOver?: PointerEventHandler<HTMLDivElement>
}) => {
  return (
    <div
      className={cn(
        'pointer-events-none absolute top-0 left-0 z-10 flex w-300 max-w-full flex-row gap-6 p-6 opacity-0 transition-opacity duration-300 lg:max-w-[80%] lg:gap-9 lg:p-9',
        {
          'right-0 left-auto flex-row-reverse': reverse,
          '!opacity-100': active,
        },
      )}
    >
      <div
        className={cn(
          'max-w-[150px] shrink-0 basis-1/4 lg:max-w-[300px] lg:basis-1/4 ',
          {
            'pointer-events-auto': active,
          },
        )}
        onPointerOver={onPointerOver}
      >
        <FilmPoster film={film} className='aspect-[2/3] w-full rounded-2xl' />
      </div>
      <div
        className={cn(
          'flex basis-3/4 flex-col gap-3 lg:justify-start lg:gap-6',
          {
            'items-end text-right': reverse,
          },
        )}
      >
        <h3 className='line-clamp-2 h-[3.75rem] font-black text-3xl lg:line-clamp-1 lg:h-[3rem] lg:text-5xl landscape:line-clamp-1 landscape:h-[1.875rem] lg:landscape:h-[3rem]'>
          {film.title}
          <span className='font-normal text-foreground/50'>
            &nbsp;({film.year})
          </span>
        </h3>
        <p className='landscape:line-clamp- line-clamp-2 font-medium text-base text-foreground/90 leading-none lg:line-clamp-1 lg:h-[1.25rem] lg:text-xl lg:leading-none landscape:h-[1rem] lg:landscape:h-[1.25rem]'>
          {film.tagline}
        </p>
        <FilmRatingGauge value={film.rating} />
      </div>
    </div>
  )
}

const FilmPreview = () => {
  const { film, isPreviewMode } = useVoroforce(
    useShallow((state) => ({
      film: state.film,
      isPreviewMode: state.isPreviewMode,
    })),
  )

  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!film) setActiveIndex(0)
  }, [film])

  return (
    <>
      {isPreviewMode && film && (
        <>
          <FilmPreviewMirrorItem
            film={film}
            active={activeIndex === 0}
            onPointerOver={() => setActiveIndex(1)}
          />
          <FilmPreviewMirrorItem
            film={film}
            reverse
            active={activeIndex === 1}
            onPointerOver={() => setActiveIndex(0)}
          />
        </>
      )}
    </>
  )
}

export default FilmPreview
