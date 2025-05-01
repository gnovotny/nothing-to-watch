import { lazy, useEffect, useMemo, useRef, useState } from 'react'

import { useMediaQuery } from '../../../../hks/use-media-query'
import { useShallowState } from '@/store'
import { orientation } from '../../../../utls/mq'
import {} from '../../../ui/drawer'
import { AnimateHeightChange } from '../../../common/animate-height-change'
import type { Film } from '../../../../vf'
import { AppDrawer } from '../../../common/app-drawer'

const FilmView = lazy(() =>
  import('./film-view').then((module) => ({ default: module.FilmView })),
)

const FilmViewFooter = lazy(() =>
  import('./film-view-footer').then((module) => ({
    default: module.FilmViewFooter,
  })),
)

export const FilmViewDrawer = () => {
  // const [ref, bounds] = useMeasure()
  const landscape = useMediaQuery(orientation('landscape'))
  const [viewMounted, setViewMounted] = useState(false)
  const [freezeFilm, setFreezeFilm] = useState(false)
  const filmRef = useRef<Film>(undefined)

  const {
    film: activeFilm,
    isSelectMode,
    // updateStoreBounds,
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

  // useEffect(() => {
  //   updateStoreBounds(bounds)
  // }, [bounds, updateStoreBounds])

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

  return (
    <AppDrawer
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
      footer={filmViewFooter}
      handleProps={{
        className: 'bg-transparent backdrop-blur-lg',
      }}
    >
      <AnimateHeightChange>{filmView}</AnimateHeightChange>
    </AppDrawer>
  )
}
