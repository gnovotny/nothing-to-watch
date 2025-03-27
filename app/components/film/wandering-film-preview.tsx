import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useMediaQuery } from '../../hooks/use-media-query'
import { clamp } from '../../utils/math'
import { down } from '../../utils/mq'
import { cn } from '../../utils/tw'
import {
  MIN_LERP_EASING_TYPES,
  type VoroforceCell,
  easedMinLerp,
  useVoroforce,
} from '../../voroforce'
import { Badge } from '../ui/badge'
import { FilmRatingGauge } from './shared/film-rating-gauge'

const WanderingFilmPreview = () => {
  const active = true
  const reverse = false
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const isSmallScreen = useMediaQuery(down('md'))

  const { film, isPreviewMode } = useVoroforce(
    useShallow((state) => ({
      film: state.film,
      isPreviewMode: state.isPreviewMode,
    })),
  )

  const primaryCell = useRef<VoroforceCell>(null)
  const voroforceRef = useRef(useVoroforce.getState().instance)
  const positionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const scaleRef = useRef<number>(0)
  const opacityRef = useRef<number>(0)
  const targetPositionRef = useRef<{ x: number; y: number }>(
    positionRef.current,
  )

  useEffect(() => {
    if (isSmallScreen) return
    const {
      ticker,
      controls,
      controls: { pointer },
    } = voroforceRef.current

    let customSpeedScale = 0

    const onTick = () => {
      if (!primaryCell.current) return
      if (!containerRef.current) return
      if (!innerRef.current) return
      positionRef.current.x = easedMinLerp(
        positionRef.current.x,
        targetPositionRef.current.x,
        0.1,
        MIN_LERP_EASING_TYPES.easeInOutQuad,
      )
      positionRef.current.y = easedMinLerp(
        positionRef.current.y,
        targetPositionRef.current.y,
        0.1,
        MIN_LERP_EASING_TYPES.easeInOutQuad,
      )

      // customSpeedScale = 1.2 - Math.max(pointer.speedScale, 0.2)
      // customSpeedScale = 1 - pointer.speedScale * 4
      customSpeedScale = 1.25 - clamp(0.25, 1.25, pointer.speedScale * 4)
      scaleRef.current = easedMinLerp(
        scaleRef.current,
        customSpeedScale,
        // customSpeedScale * 0.5 + 0.5 * primaryCell.current.weight,
        0.05,
        MIN_LERP_EASING_TYPES.easeInOutQuad,
      )
      opacityRef.current = easedMinLerp(
        scaleRef.current,
        customSpeedScale,
        0.05,
        MIN_LERP_EASING_TYPES.linear,
      )
      containerRef.current.style.translate = `${positionRef.current.x}px ${positionRef.current.y}px`
      innerRef.current.style.scale = `${scaleRef.current}`
      innerRef.current.style.opacity = `${scaleRef.current}`
    }

    const onCellFocused = ({
      cell,
      cells,
    }: { cell: VoroforceCell; cells: VoroforceCell[] }) => {
      if (cell) {
        primaryCell.current = cell
        const {
          config: {
            lattice: { cols },
          },
        } = voroforceRef.current
        const neighborCell = cells[cell.index - cols]
        if (neighborCell) {
          targetPositionRef.current = neighborCell
        }
      }
    }
    ticker.addEventListener('tick', onTick)
    controls.addEventListener('focused', onCellFocused)

    return () => {
      ticker.removeEventListener('tick', onTick)
      controls.removeEventListener('focused', onCellFocused)
    }
  }, [isSmallScreen])

  return (
    <>
      {isPreviewMode && film && (
        <div
          ref={containerRef}
          className={cn(
            'pointer-events-none absolute top-0 left-0 z-10 w-300 max-w-full p-6 opacity-0 transition-opacity duration-300 will-change-transform md:p-0 lg:p-9',
            {
              'right-0 left-auto': reverse,
              '!opacity-100': active,
            },
          )}
        >
          <div
            ref={innerRef}
            className={cn(
              'md:-translate-y-full md:-translate-x-1/4 flex origin-top-left flex-row gap-6 will-change-[transform,opacity] lg:gap-9',
              {
                'flex-row-reverse': reverse,
              },
            )}
          >
            {/*<FilmPoster*/}
            {/*  film={film}*/}
            {/*  className={cn(*/}
            {/*    'w-full max-w-[150px] shrink-0 basis-1/4 rounded-2xl lg:max-w-[300px] lg:basis-1/4',*/}
            {/*    {*/}
            {/*      'pointer-events-auto': active,*/}
            {/*    },*/}
            {/*  )}*/}
            {/*  // onPointerOver={onPointerOver}*/}
            {/*/>*/}
            <div
              className={cn(
                'flex basis-3/4 flex-col gap-3 lg:justify-start lg:gap-6',
                {
                  'items-end text-right': reverse,
                },
              )}
            >
              <p className='landscape:line-clamp- line-clamp-2 hidden font-medium text-base text-foreground/90 leading-none md:inline-block lg:line-clamp-1 lg:h-[1.25rem] lg:text-xl lg:leading-none landscape:h-[1rem] lg:landscape:h-[1.25rem]'>
                {film.tagline}
              </p>
              <h3
                // className='line-clamp-2 h-[3.75rem] font-black text-3xl lg:line-clamp-1 lg:h-[3rem] lg:text-5xl landscape:line-clamp-1 landscape:h-[1.875rem] lg:landscape:h-[3rem]'
                className='line-clamp-2.2 font-black text-3xl lg:line-clamp-1.1 lg:text-5xl landscape:line-clamp-1.1'
              >
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
        </div>
      )}
    </>
  )
}

export default WanderingFilmPreview
