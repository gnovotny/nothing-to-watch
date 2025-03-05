import slugify from 'slugify'
import config from '../../../config'
import { cn } from '../../../lib/utils/tw'
import { type Film, useVoroforce } from '../../../lib/voroforce'
import { Badge } from '../../ui/badge'
import { FilmPoster } from '../shared/film-poster'
import { FilmRatingGauge } from '../shared/film-rating-gauge'

import { Button } from '../../ui/button'
import { AddCustomLinkDialog } from './add-custom-link-dialog'
import { Copy, X } from 'lucide-react'

export const FilmView = ({
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
                  className='-bottom-2 -end-2 absolute inline-flex size-5 items-center justify-center rounded-full border-2 border-white bg-blue-500 font-bold text-white text-xs dark:border-gray-900'
                  onClick={() => {
                    void navigator?.clipboard?.writeText(
                      `${window.location.href.split('?')[0]}?customLinkBase64=${window.btoa(JSON.stringify({ name, baseUrl, slug, property }))}`,
                    )
                  }}
                  title='Copy to Clipboard'
                >
                  <Copy className='!size-3' />
                </Button>

                <Button
                  size='icon'
                  variant='unstyled'
                  className='-top-2 -end-2 absolute inline-flex size-5 items-center justify-center rounded-full border-2 border-white bg-red-500 font-bold text-white text-xs dark:border-gray-900'
                  onClick={() => {
                    userConfig.customLinks?.splice(index, 1)
                    userConfig.customLinks = [...(userConfig.customLinks ?? [])]
                    setUserConfig(userConfig)
                  }}
                  title='Remove'
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
