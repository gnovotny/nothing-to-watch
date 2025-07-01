import { useCallback, useEffect, useRef, useState } from 'react'
import useMeasure from 'react-use-measure'

import { store, useShallowState } from '@/store'
import { MIN_LERP_EASING_TYPES, type VoroforceCell, easedMinLerp } from '@/vf'
import { useMediaQuery } from '../../../hooks/use-media-query'
import { clamp } from '../../../utils/math'
import { down } from '../../../utils/mq'
import { cn } from '../../../utils/tw'
import { Badge } from '../../ui/badge'
import { FilmPoster } from './shared/film-poster'
import { FilmRatingGauge } from './shared/film-rating-gauge'

export const FilmPreview = ({ poster = false }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const isSmallScreen = useMediaQuery(down('md'))

  const [measureRef, bounds] = useMeasure()

  const { film, isPreviewMode } = useShallowState((state) => ({
    film: state.film,
    isPreviewMode: state.isPreviewMode,
  }))

  const [reverseX, setReverseX] = useState(false)
  const [reverseY, setReverseY] = useState(false)

  const cellsRef = useRef<VoroforceCell[]>(null)
  const primaryCellRef = useRef<VoroforceCell>(null)
  const voroforceRef = useRef(store.getState().voroforce)
  const topNeighborCellRef = useRef<{ x: number; y: number }>(undefined)
  const bottomNeighborCellRef = useRef<{ x: number; y: number }>(undefined)
  const positionRef = useRef<{ x: number; y: number }>(undefined)
  const scaleRef = useRef<number>(0)
  const opacityRef = useRef<number>(0)
  const frameRef = useRef<number>(0)

  const onCellFocused = useCallback(
    ({ cell }: { cell?: VoroforceCell } = {}) => {
      if (isSmallScreen) return
      if (cell) primaryCellRef.current = cell
      if (!primaryCellRef.current || !cellsRef.current) return

      const {
        config: {
          lattice: { cols },
        },
      } = voroforceRef.current
      topNeighborCellRef.current =
        cellsRef.current[primaryCellRef.current.index - cols] ??
        topNeighborCellRef.current

      bottomNeighborCellRef.current =
        cellsRef.current[primaryCellRef.current.index + cols] ??
        bottomNeighborCellRef.current
    },
    [isSmallScreen],
  )

  const resetStyles = useCallback(() => {
    if (!containerRef.current) return
    if (!innerRef.current) return
    containerRef.current.style.translate = ''
    innerRef.current.style.scale = ''
    innerRef.current.style.opacity = ''
  }, [])

  const applyStyles = useCallback(() => {
    if (!containerRef.current) return
    if (!innerRef.current) return
    if (!positionRef.current) return
    containerRef.current.style.translate = `${positionRef.current.x}px ${positionRef.current.y}px`
    innerRef.current.style.scale = `${scaleRef.current}`
    innerRef.current.style.opacity = `${scaleRef.current}`
  }, [])

  useEffect(() => {
    if (isSmallScreen) {
      resetStyles()
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
        0.05,
        MIN_LERP_EASING_TYPES.easeInOutQuad,
      )
      opacityRef.current = easedMinLerp(
        opacityRef.current,
        customSpeedScale,
        0.05,
      )
      applyStyles()

      if (frameRef.current % 60 === 0) {
        if (topNeighborCellRef.current.y - bounds.height < 0) {
          setReverseY(true)
        } else if (
          reverseY &&
          topNeighborCellRef.current.y - bounds.height > bounds.height
        ) {
          setReverseY(false)
        }

        const width = bounds.width * 0.25

        if (neighborCell.x - width < 0) {
          setReverseX(true)
        } else if (reverseX && neighborCell.x - width > width) {
          setReverseX(false)
        }
      }

      frameRef.current++
    }

    ticker.addEventListener('tick', onTick)

    return () => {
      ticker.removeEventListener('tick', onTick)
    }
  }, [isSmallScreen, bounds, reverseY, reverseX, applyStyles, resetStyles])

  useEffect(() => {
    if (isSmallScreen) return
    const { controls, cells } = voroforceRef.current
    if (!cellsRef.current) cellsRef.current = cells as VoroforceCell[]

    controls.addEventListener('focused', onCellFocused)
    return () => {
      controls.removeEventListener('focused', onCellFocused)
    }
  }, [isSmallScreen, onCellFocused])

  return (
    <>
      {/*{isPreviewMode && film && (*/}
      {film && (
        <div
          ref={(element) => {
            containerRef.current = element
            measureRef(element)
          }}
          className={cn(
            'pointer-events-none fixed top-0 left-0 z-10 w-full max-w-full p-4 opacity-0 transition-opacity duration-700 md:w-300 md:p-0 md:will-change-transform lg:p-9',
            {
              '!opacity-100': isPreviewMode,
            },
          )}
        >
          <div
            ref={innerRef}
            className={cn(
              'flex origin-top-left flex-row gap-3 md:will-change-[transform,opacity] lg:gap-9',
              {
                'flex-row-reverse': reverseX,
              },
            )}
          >
            {poster && (
              <FilmPoster
                film={film}
                className={cn(
                  'w-full max-w-[150px] shrink-0 basis-1/4 rounded-2xl lg:max-w-[300px] lg:basis-1/4',
                  {
                    'pointer-events-auto': isPreviewMode,
                  },
                )}
              />
            )}
            <div
              className={cn(
                'flex basis-full flex-row justify-between gap-3 md:basis-3/4 md:flex-col md:justify-start md:gap-4 lg:gap-6',
                {
                  'items-end text-right': reverseX,
                  'md:flex-col-reverse': reverseY,
                },
              )}
            >
              <div
                className={cn('flex flex-col gap-3 lg:justify-start lg:gap-3', {
                  'flex-col-reverse': reverseY,
                })}
              >
                <p className='line-clamp-2 hidden font-medium text-base text-foreground/90 leading-none md:inline-block lg:line-clamp-1 lg:h-[1.25rem] lg:text-xl lg:leading-none landscape:h-[1rem] lg:landscape:h-[1.25rem]'>
                  {film.tagline}
                </p>
                <h3 className='line-clamp-2.2 font-black text-2xl leading-none lg:line-clamp-1.1 lg:text-5xl landscape:line-clamp-1.1'>
                  {film.title}
                  <span className='font-normal text-foreground/50 text-xl leading-none lg:text-3xl'>
                    &nbsp;({film.year})
                  </span>
                </h3>
                <div
                  className={cn(
                    'flex flex-row flex-wrap gap-3 lg:flex-nowrap lg:pt-2',
                    {
                      'justify-end': reverseX,
                    },
                  )}
                >
                  {film.genres?.map((genre) => (
                    <Badge
                      key={genre}
                      className='whitespace-nowrap text-[0.6rem] leading-none lg:text-xs'
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
              <FilmRatingGauge value={film.rating} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
