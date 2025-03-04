import { useMediaQuery } from '../../../hooks/use-media-query'
import { orientation } from '../../../lib/utils/mq'
import { useEffect, useMemo } from 'react'
import useMeasure from 'react-use-measure'
import slugify from 'slugify'
import { Drawer as DrawerPrimitive } from 'vaul'
import { useShallow } from 'zustand/react/shallow'
import config from '../../../config'
import { cn } from '../../../lib/utils/tw'
import { type Film, useVoroforce } from '../../../lib/voroforce'
import { Badge } from '../../ui/badge'
import { Drawer, DrawerFooter, DrawerPortal } from '../../ui/drawer'
import { FilmPoster } from '../shared/film-poster'
import { FilmRatingGauge } from '../shared/film-rating-gauge'

import { Button } from '../../ui/button'
import { AddCustomLinkDialog } from './add-custom-link-dialog'
import { X } from 'lucide-react'

const FilmView = ({
  film,
  className = '',
}: { film?: Film; className?: string }) => {
  const customLinks = useVoroforce((state) => state.userConfig.customLinks)
  const userConfig = useVoroforce((state) => state.userConfig)
  const setUserConfig = useVoroforce((state) => state.setUserConfig)

  if (!film) return
  return (
    <div className={cn('flex flex-col pb-9 landscape:h-full', className)}>
      <div
        className={cn(
          ' h-52 w-full lg:h-96',
          // 'bg-background/60',
          {},
        )}
        style={{
          // backgroundPosition:
          //   'calc((((100vw / 2.222222) - 20px) / 1.5) / 2) 0',
          backgroundPosition: 'calc((((50vw / 2.222222) - 20px) / 1.5) / 2) 0',
          backgroundImage: `url('${config.backdropBaseUrl}${film.backdrop}')`,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          // backgroundBlendMode: 'lighten',
        }}
      >
        <div
          className='flex h-full w-full flex-row gap-6 p-6'
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--background) calc((25vw - 170px) - 340px), color-mix(in oklab, var(--background) 64%, transparent) 50%, color-mix(in oklab, var(--background) 64%, transparent) 100%)',
          }}
        >
          <FilmPoster film={film} className='aspect-[2/3] h-full rounded-sm' />
          <div className='flex flex-col justify-between gap-9'>
            <div className='flex flex-col gap-3'>
              <h3 className='font-black text-3xl lg:text-5xl'>
                {film.title}
                <span className='font-medium text-foreground/50'>
                  &nbsp;({film.year})
                </span>{' '}
              </h3>
              <p className='text-base text-foreground/80 italic lg:text-xl'>
                {film.tagline}
              </p>
              <div className='flex flex-row gap-3 pt-2'>
                {film.genres?.map((genre) => (
                  <Badge key={genre}>{genre}</Badge>
                ))}
              </div>
            </div>
            <div className='flex flex-row items-center gap-3'>
              <FilmRatingGauge value={film.rating} />
              <div className='text-sm leading-none'>
                TMDB <br />
                Score
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className={cn(
          'flex grow flex-col justify-between gap-3 p-6 lg:justify-start lg:gap-6 lg:p-9',
          {},
        )}
      >
        <p className='text-base lg:text-xl'>{film.overview}</p>
        <div className='flex flex-row gap-3'>
          <Button asChild>
            <a
              href={`https://www.themoviedb.org/movie/${film.tmdbId}`}
              target='_blank'
              rel='noreferrer'
            >
              TMDB
            </a>
          </Button>
          <Button asChild>
            <a
              href={`https://imdb.com/title/${film.imdbId}`}
              target='_blank'
              rel='noreferrer'
            >
              IMDB
            </a>
          </Button>
          {customLinks?.map(({ name, baseUrl, slug, property }, index) => (
            <Button asChild key={baseUrl}>
              <div className='relative'>
                <a
                  href={`${baseUrl}${(slug ? (v: string) => slugify(v).toLowerCase() : (v: string) => v)(String(film[property]))}`}
                  target='_blank'
                  rel='noreferrer noopener'
                >
                  {name}
                </a>
                <Button
                  size='icon'
                  variant='unstyled'
                  className='-top-2 -end-2 absolute inline-flex size-5 items-center justify-center rounded-full border-2 border-white bg-red-500 font-bold text-white text-xs dark:border-gray-900'
                  onClick={() => {
                    userConfig.customLinks?.splice(index, 1)
                    userConfig.customLinks = [...(userConfig.customLinks ?? [])]
                    setUserConfig(userConfig)
                  }}
                >
                  <X className='!size-3' />
                </Button>
              </div>
            </Button>
          ))}
          <AddCustomLinkDialog />
        </div>
      </div>
    </div>
  )
}

const FilmViewDrawer = () => {
  const [ref, bounds] = useMeasure()
  const landscape = useMediaQuery(orientation('landscape'))

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

  const filmView = useMemo(() => <FilmView film={film} />, [film])

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
              {/*<DrawerHeader>*/}
              {/*  <DrawerTitle>Move Goal</DrawerTitle>*/}
              {/*  <DrawerDescription>*/}
              {/*    Set your daily activity goal.*/}
              {/*  </DrawerDescription>*/}
              {/*</DrawerHeader>*/}
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

export default FilmViewDrawer
