import { useCallback, useEffect, useRef, useState } from 'react'
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
import useMeasure from 'react-use-measure'

const WanderingFilmPreview = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const isSmallScreen = useMediaQuery(down('md'))

  const [measureRef, bounds] = useMeasure()

  const { film, isPreviewMode } = useVoroforce(
    useShallow((state) => ({
      film: state.film,
      isPreviewMode: state.isPreviewMode,
    })),
  )

  const [active] = useState(true)
  const [reverseX, setReverseX] = useState(false)
  const [reverseY, setReverseY] = useState(false)

  const cellsRef = useRef<VoroforceCell[]>(null)
  const primaryCellRef = useRef<VoroforceCell>(null)
  const voroforceRef = useRef(useVoroforce.getState().instance)
  const topNeighborCellRef = useRef<{ x: number; y: number }>(undefined)
  const bottomNeighborCellRef = useRef<{ x: number; y: number }>(undefined)
  const positionRef = useRef<{ x: number; y: number }>(undefined)
  const scaleRef = useRef<number>(0)
  const opacityRef = useRef<number>(0)
  const frameRef = useRef<number>(0)

  const onCellFocused = useCallback(
    ({ cell }: { cell?: VoroforceCell } = {}) => {
      if (cell) {
        primaryCellRef.current = cell
      }

      if (primaryCellRef.current && cellsRef.current) {
        const {
          config: {
            lattice: { cols },
          },
        } = voroforceRef.current
        const topNeighborCell =
          cellsRef.current[primaryCellRef.current.index - cols]
        if (topNeighborCell) {
          topNeighborCellRef.current = topNeighborCell
        }

        const bottomNeighborCell =
          cellsRef.current[primaryCellRef.current.index + cols]
        if (bottomNeighborCell) {
          bottomNeighborCellRef.current = bottomNeighborCell
        }
      }
    },
    [],
  )

  useEffect(() => {
    if (isSmallScreen) {
      if (!containerRef.current) return
      if (!innerRef.current) return
      containerRef.current.style.translate = ''
      innerRef.current.style.scale = ''
      innerRef.current.style.opacity = ''
      return
    }
    const {
      ticker,
      controls: { pointer },
    } = voroforceRef.current

    let customSpeedScale = 0

    const onTick = () => {
      if (!primaryCellRef.current) return
      if (!containerRef.current) return
      if (!innerRef.current) return
      if (!topNeighborCellRef.current) return
      if (!bottomNeighborCellRef.current) return

      const neighborCell = reverseY
        ? bottomNeighborCellRef.current
        : topNeighborCellRef.current
      const targetPosition = {
        x:
          neighborCell.x -
          (reverseX ? bounds.width * 0.5 : bounds.width * 0.25),
        y: neighborCell.y - (reverseY ? 0 : bounds.height),
      }

      if (!positionRef.current) {
        positionRef.current = {
          x: targetPosition.x,
          y: targetPosition.y,
        }
      } else {
        positionRef.current.x = easedMinLerp(
          positionRef.current.x,
          targetPosition.x,
          0.1,
          MIN_LERP_EASING_TYPES.easeInOutQuad,
        )
        positionRef.current.y = easedMinLerp(
          positionRef.current.y,
          targetPosition.y,
          0.1,
          MIN_LERP_EASING_TYPES.easeInOutQuad,
        )
      }

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

      if (frameRef.current % 60 === 0) {
        // const bbox = innerRef.current.getBoundingClientRect()
        // const bbox = containerRef.current.getBoundingClientRect()

        if (topNeighborCellRef.current.y - bounds.height < 0) {
          // if (bbox.top < 0) {
          setReverseY(true)
          // } else if (bbox.top + bbox.height > window.innerHeight) {
        } else if (reverseY) {
          setReverseY(false)
        }

        if (neighborCell.x - bounds.width * 0.25 < 0) {
          // if (bbox.left < 0) {
          setReverseX(true)
          // } else if (bbox.left + bbox.width > window.innerWidth) {
        } else if (reverseX) {
          setReverseX(false)
        }
      }

      frameRef.current++
    }

    ticker.addEventListener('tick', onTick)

    return () => {
      ticker.removeEventListener('tick', onTick)
    }
  }, [isSmallScreen, bounds, reverseY, reverseX])

  useEffect(() => {
    if (isSmallScreen) return
    const { controls, cells } = voroforceRef.current
    if (!cellsRef.current) {
      cellsRef.current = cells as VoroforceCell[]
    }

    controls.addEventListener('focused', onCellFocused)

    return () => {
      controls.removeEventListener('focused', onCellFocused)
    }
  }, [isSmallScreen, onCellFocused])

  // useEffect(() => {
  //   console.log('bounds', bounds)
  // }, [bounds])

  return (
    <>
      {isPreviewMode && film && (
        <div
          // ref={containerRef}
          ref={(element) => {
            containerRef.current = element
            measureRef(element)
          }}
          className={cn(
            'pointer-events-none absolute top-0 left-0 z-10 w-300 max-w-full p-6 opacity-0 transition-opacity duration-300 will-change-transform md:p-0 lg:p-9',
            {
              'right-0 left-auto': reverseX,
              '!opacity-100': active,
            },
          )}
        >
          <div
            ref={innerRef}
            // ref={(element) => {
            //   innerRef.current = element
            //   measureRef(element)
            // }}
            className={cn(
              'flex origin-top-left flex-row gap-6 will-change-[transform,opacity] lg:gap-9',
              // 'md:-translate-y-full md:-translate-x-1/4',
              {
                'flex-row-reverse': reverseX,
                // 'md:!translate-y-0': reverseY,
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
                  'items-end text-right': reverseX,
                  'flex-col-reverse': reverseY,
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
