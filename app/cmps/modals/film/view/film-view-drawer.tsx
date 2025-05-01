import { lazy, useEffect, useMemo, useRef, useState } from 'react'

import { useMediaQuery } from '../../../../hks/use-media-query'
import { useShallowState } from '@/store'
import { orientation } from '../../../../utls/mq'
import { AnimateHeightChange } from '../../../common/animate-height-change'
import type { Film } from '../../../../vf'
import { Modal } from '../../../common/modal'
import { cn } from '../../../../utls/tw'
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
  } = useShallowState((state) => ({
    film: state.film,
    isSelectMode: state.isSelectMode,
    updateStoreBounds: state.setFilmViewBounds,
    exitVoroforceSelectMode: state.exitSelectMode,
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

  return (
    <Modal
      rootProps={{
        direction: landscape ? 'left' : 'top',
        open: isSelectMode,
        onClose: exitVoroforceSelectMode,
        modal: false,
      }}
      contentProps={{
        onMouseEnter: () => setFreezeFilm(true),
        onMouseLeave: () => setFreezeFilm(false),
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
      <AnimateHeightChange
        duration={500}
        delay={100}
        onMouseEnter={() => setViewHovered(true)}
        onMouseLeave={() => setViewHovered(false)}
      >
        {filmView}
      </AnimateHeightChange>
    </Modal>
  )
}
