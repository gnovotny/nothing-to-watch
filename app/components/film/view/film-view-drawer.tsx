import { useEffect, useMemo, lazy, useState } from 'react'
import useMeasure from 'react-use-measure'
import { Drawer as DrawerPrimitive } from 'vaul'
import { useShallow } from 'zustand/react/shallow'

import { useMediaQuery } from '../../../hooks/use-media-query'
import { orientation } from '../../../lib/utils/mq'
import { useVoroforce } from '../../../lib/voroforce'
import {
  Drawer,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPortal,
  DrawerTitle,
} from '../../ui/drawer'
import { cn } from '../../../lib/utils/tw'
import { Button } from '../../ui/button'

const FilmView = lazy(() =>
  import('./film-view').then((module) => ({ default: module.FilmView })),
)

export const FilmViewDrawer = () => {
  const [ref, bounds] = useMeasure()
  const landscape = useMediaQuery(orientation('landscape'))
  const [mounted, setMounted] = useState(false)

  const { film, isSelectMode, updateStoreBounds } = useVoroforce(
    useShallow((state) => ({
      film: state.film,
      isSelectMode: state.isSelectMode,
      updateStoreBounds: state.setFilmViewBounds,
    })),
  )

  useEffect(() => {
    updateStoreBounds(bounds)
  }, [bounds, updateStoreBounds])

  useEffect(() => {
    if (isSelectMode) setMounted(true)
  }, [isSelectMode])

  const filmView = useMemo(
    () => mounted && <FilmView film={film} />,
    [mounted, film],
  )

  const exitVoroforceSelectMode = useVoroforce((state) => state.exitSelectMode)
  return (
    <Drawer
      open={isSelectMode}
      direction={landscape ? 'left' : 'top'}
      disablePreventScroll
      modal={false}
      shouldScaleBackground={false}
      onClose={exitVoroforceSelectMode}
    >
      <DrawerPortal>
        <DrawerPrimitive.Content
          ref={ref}
          className={cn(
            '!pointer-events-auto landscape:-translate-y-1/2 fixed not-landscape:inset-x-0 not-landscape:top-0 z-50 not-landscape:mb-24 flex not-landscape:h-auto not-landscape:flex-col-reverse overflow-hidden not-landscape:rounded-b-3xl border bg-background landscape:top-1/2 landscape:left-0 landscape:h-full landscape:max-h-[48rem] landscape:max-w-[40%] landscape:flex-row-reverse landscape:rounded-r-3xl',
          )}
        >
          <div className='relative h-full w-full'>
            <div className='not-landscape:-translate-x-1/2 landscape:-translate-y-1/2 absolute not-landscape:bottom-4 not-landscape:left-1/2 not-landscape:h-1.5 not-landscape:w-[100px] cursor-grab rounded-full bg-muted landscape:top-1/2 landscape:right-4 landscape:h-[100px] landscape:w-1.5' />
            <div className='not-landscape:w-full landscape:h-full'>
              <DrawerHeader className='sr-only'>
                <DrawerTitle>{film?.title}</DrawerTitle>
                <DrawerDescription>{film?.title}</DrawerDescription>
              </DrawerHeader>
              {filmView}
              <DrawerFooter>
                <Button variant='outline' onClick={exitVoroforceSelectMode}>
                  Close
                </Button>
              </DrawerFooter>
            </div>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPortal>
    </Drawer>
  )
}
