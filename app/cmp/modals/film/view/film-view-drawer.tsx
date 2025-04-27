import { lazy, useEffect, useMemo, useRef, useState } from 'react'
import useMeasure from 'react-use-measure'
import { Drawer as DrawerPrimitive } from 'vaul'
import { useShallow } from 'zustand/react/shallow'

import { useMediaQuery } from '@/hk/use-media-query'
import { store } from '@/store'
import { orientation } from '@/utl/mq'
import { cn } from '@/utl/tw'
import {
  Drawer,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPortal,
  DrawerTitle,
} from '@/cmp/ui/drawer'
import { AnimateHeightChange } from '../../../common/animate-height-change'
import type { Film } from '../../../../vf'

const FilmView = lazy(() =>
  import('./film-view').then((module) => ({ default: module.FilmView })),
)

const FilmViewFooter = lazy(() =>
  import('./film-view-footer').then((module) => ({
    default: module.FilmViewFooter,
  })),
)

export const FilmViewDrawer = () => {
  const [ref, bounds] = useMeasure()
  const landscape = useMediaQuery(orientation('landscape'))
  const [viewMounted, setViewMounted] = useState(false)
  const [freezeFilm, setFreezeFilm] = useState(false)
  const filmRef = useRef<Film>(undefined)

  const {
    film: activeFilm,
    isSelectMode,
    updateStoreBounds,
    exitVoroforceSelectMode,
  } = store(
    useShallow((state) => ({
      film: state.film,
      isSelectMode: state.isSelectMode,
      updateStoreBounds: state.setFilmViewBounds,
      exitVoroforceSelectMode: state.exitSelectMode,
    })),
  )

  const film = useMemo(() => {
    if (freezeFilm) return filmRef.current

    filmRef.current = activeFilm
    return activeFilm
  }, [activeFilm, freezeFilm])

  useEffect(() => {
    updateStoreBounds(bounds)
  }, [bounds, updateStoreBounds])

  useEffect(() => {
    if (isSelectMode) setViewMounted(true)
  }, [isSelectMode])

  const filmView = useMemo(
    () => viewMounted && <FilmView film={film} />,
    [viewMounted, film],
  )

  const filmViewFooter = useMemo(
    () => viewMounted && <FilmViewFooter film={film} />,
    [viewMounted, film],
  )

  const [isDragging, setIsDragging] = useState(false)

  return (
    <Drawer
      open={isSelectMode}
      direction={landscape ? 'left' : 'top'}
      disablePreventScroll
      modal={false}
      shouldScaleBackground={false}
      onClose={exitVoroforceSelectMode}
      onDrag={() => setIsDragging(true)}
      onRelease={() => setIsDragging(false)}
    >
      <DrawerPortal>
        <DrawerPrimitive.Content
          ref={ref}
          className={cn(
            '!pointer-events-auto not-landscape:-inset-x-px fixed not-landscape:top-0 z-30 not-landscape:mb-24 not-landscape:h-auto cursor-grab focus-visible:outline-none not-landscape:md:inset-x-0 md:px-6 lg:pt-6 landscape:top-0 landscape:left-0 landscape:h-full landscape:max-h-[36rem] landscape:max-w-[40%] landscape:lg:h-auto landscape:lg:max-h-none landscape:lg:w-[40%]',
            {
              'cursor-grabbing': isDragging,
            },
          )}
        >
          <div
            onMouseEnter={() => setFreezeFilm(true)}
            onMouseLeave={() => setFreezeFilm(false)}
            className='relative flex h-full w-full not-landscape:flex-col-reverse overflow-hidden not-landscape:rounded-b-3xl border-x border-b bg-background lg:h-auto lg:border-t landscape:flex-row-reverse landscape:rounded-3xl'
          >
            <div className='not-landscape:-translate-x-1/2 landscape:-translate-y-1/2 absolute not-landscape:bottom-4 not-landscape:left-1/2 not-landscape:h-1.5 not-landscape:w-[100px] rounded-full border border-muted bg-background landscape:top-1/2 landscape:right-4 landscape:h-[100px] landscape:w-2.5' />
            <div className='not-landscape:w-full landscape:h-full landscape:lg:h-full'>
              <DrawerHeader className='sr-only'>
                <DrawerTitle>{film?.title}</DrawerTitle>
                <DrawerDescription>{film?.title}</DrawerDescription>
              </DrawerHeader>
              <AnimateHeightChange>{filmView}</AnimateHeightChange>
              <DrawerFooter className='pointer-events-none absolute inset-x-0 bottom-0 z-1 w-full p-0'>
                {filmViewFooter}
              </DrawerFooter>
            </div>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPortal>
    </Drawer>
  )
}
