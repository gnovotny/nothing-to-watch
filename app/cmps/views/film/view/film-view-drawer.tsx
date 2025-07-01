import { lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useShallowState } from '@/store'
import { useMediaQuery } from '../../../../hooks/use-media-query'
import { orientation } from '../../../../utils/mq'
import { cn } from '../../../../utils/tw'
import type { Film } from '../../../../vf'
import { AnimateDimensionsChange } from '../../../common/animate-dimensions-change'
import { Modal } from '../../../common/modal'
import { AddCustomLinkModal } from './add-custom-link-modal'

const FilmView = lazy(() =>
  import('./film-view').then((module) => ({ default: module.FilmView })),
)

const FilmViewFooter = lazy(() =>
  import('./film-view-footer').then((module) => ({
    default: module.FilmViewFooter,
  })),
)

export const FilmViewDrawer = () => {
  const landscape = useMediaQuery(orientation('landscape'))
  const [viewMounted, setViewMounted] = useState(false)
  const [freezeFilm, setFreezeFilm] = useState(false)
  const filmRef = useRef<Film>(undefined)

  const {
    film: activeFilm,
    isSelectMode,
    exitVoroforceSelectMode,
    newLinkTypeOpen,
  } = useShallowState((state) => ({
    film: state.film,
    isSelectMode: state.isSelectMode,
    updateStoreBounds: state.setFilmViewBounds,
    exitVoroforceSelectMode: state.exitSelectMode,
    newLinkTypeOpen: state.newLinkTypeOpen,
  }))

  const film = useMemo(() => {
    if (freezeFilm) return filmRef.current

    filmRef.current = activeFilm
    return activeFilm
  }, [activeFilm, freezeFilm])

  useEffect(() => {
    if (isSelectMode) setViewMounted(true)
  }, [isSelectMode])

  const [viewHovered, setViewHovered] = useState(false)

  const filmView = useMemo(
    () => viewMounted && <FilmView film={film} />,
    [viewMounted, film],
  )

  const filmViewFooter = useMemo(
    () => viewMounted && <FilmViewFooter film={film} />,
    [viewMounted, film],
  )

  const onClose = useCallback(() => {
    exitVoroforceSelectMode()
    setFreezeFilm(false)
  }, [exitVoroforceSelectMode])

  return (
    <Modal
      rootProps={{
        direction: landscape ? 'left' : 'top',
        open: isSelectMode,
        onClose,
        modal: false,
      }}
      contentProps={{
        onMouseEnter: () => setFreezeFilm(true),
        onMouseLeave: () => setFreezeFilm(false),
        className: cn(
          'group landscape:max-lg:min-w-[33vw] landscape:max-lg:max-w-[66vw]',
          {
            'contain-layout contain-paint contain-style': !newLinkTypeOpen,
          },
        ),
      }}
      innerContentProps={{
        className: cn({
          'bg-background': viewHovered,
        }),
      }}
      footer={filmViewFooter}
      handleProps={{
        className:
          'max-md:bg-background max-md:-translate-y-[150%] max-md:h-1.5 lg:bg-transparent lg:backdrop-blur-lg',
      }}
      additional={<AddCustomLinkModal />}
    >
      <AnimateDimensionsChange
        axis='height'
        className='relative max-lg:landscape:static'
        duration={500}
        delay={100}
        onMouseEnter={() => setViewHovered(true)}
        onMouseLeave={() => setViewHovered(false)}
      >
        {filmView}
      </AnimateDimensionsChange>
    </Modal>
  )
}
