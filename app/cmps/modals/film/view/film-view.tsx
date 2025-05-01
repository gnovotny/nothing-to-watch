import config from '@/config'
import { cn } from '../../../../utls/tw'
import type { Film } from '@/vf'
import { Badge } from '../../../ui/badge'
import { FilmRatingGauge } from '../shared/film-rating-gauge'
import {} from 'lucide-react'
import { store } from '@/store'
import {} from '../../../ui/tooltip'
import { useEffect, useMemo, useState } from 'react'

export const FilmView = ({
  film,
  className = '',
}: { film?: Film; className?: string }) => {
  const ua = store((state) => state.ua)

  const [backdropHidden, setBackdropHidden] = useState(true)
  const [backdropErrored, setBackdropErrored] = useState(true)

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setBackdropHidden(true)
  }, [film])

  const isIOS = useMemo(() => ua.getOS()?.name === 'iOS', [ua])

  if (!film) return
  return (
    <div
      className={cn(
        'landscape:h-full',
        // 'bg-center bg-cover bg-no-repeat',
        className,
      )}
      // style={{
      //   // backgroundPosition: 'calc((((50vw / 2.222222) - 20px) / 1.5) / 2) 0',
      //   backgroundImage: `url('${config.backdropBaseUrl}${film.backdrop}')`,
      //   // backgroundBlendMode: 'lighten',
      // }}
    >
      {!isIOS && (
        <img
          className={cn(
            'absolute inset-0 h-full w-full object-cover object-center opacity-0 transition-[opacity] duration-500 will-change-[opacity]',
            {
              '!w-0 !h-0': backdropErrored,
              '!opacity-50': !backdropHidden,
            },
          )}
          alt=''
          src={`${config.backdropBaseUrl}${film.backdrop}`}
          onLoad={() => {
            setBackdropHidden(false)
            setBackdropErrored(false)
          }}
          onError={() => {
            setBackdropErrored(true)
          }}
        />
      )}
      <div
        className='relative z-1 flex h-full w-full flex-col'
        // style={{
        //   backgroundImage:
        //     'linear-gradient(to right, var(--background) calc((25vw - 170px) - 340px), color-mix(in oklab, var(--background) 64%, transparent) 50%, color-mix(in oklab, var(--background) 64%, transparent) 100%)',
        // }}
      >
        <div
          className={cn(
            'max-h-52 w-full md:max-h-auto',
            // 'bg-background/60',
            {},
          )}
          // style={{
          //   backgroundPosition: 'center center',
          //   // backgroundPosition: 'calc((((50vw / 2.222222) - 20px) / 1.5) / 2) 0',
          //   backgroundImage: `url('${config.backdropBaseUrl}${film.backdrop}')`,
          //   backgroundSize: 'cover',
          //   backgroundRepeat: 'no-repeat',
          //   // backgroundBlendMode: 'lighten',
          // }}
        >
          <div
            className='flex h-full w-full flex-row gap-6 p-4 md:p-6 lg:p-9'
            // style={{
            //   backgroundImage:
            //     'linear-gradient(to right, var(--background) calc((25vw - 170px) - 340px), color-mix(in oklab, var(--background) 64%, transparent) 50%, color-mix(in oklab, var(--background) 64%, transparent) 100%)',
            // }}
          >
            {/*<FilmPoster film={film} className='aspect-[2/3] h-full rounded-sm' />*/}
            <div className='flex w-full flex-col justify-between gap-9'>
              <div className='flex w-full flex-col gap-3'>
                <div className='relative flex w-full flex-row items-start justify-between gap-3 pr-28'>
                  <h3 className='font-black text-2xl leading-none md:text-3xl lg:text-5xl'>
                    {film.title}
                    {film.year && (
                      <span className='font-medium text-foreground/50'>
                        &nbsp;({film.year})
                      </span>
                    )}
                  </h3>
                  <div className='absolute top-0 right-0 flex flex-row-reverse items-center gap-3'>
                    <FilmRatingGauge value={film.rating} />
                    <div className='hidden text-xxs leading-none md:block'>
                      TMDB <br />
                      Score
                    </div>
                  </div>
                </div>
                <div className='flex w-full flex-row justify-between gap-3'>
                  <div className='flex flex-col gap-3'>
                    <p className='text-base text-foreground/80 italic lg:text-xl'>
                      {film.tagline}
                    </p>
                    <div className='flex flex-row gap-3 pt-2'>
                      {film.genres?.map((genre) => (
                        <Badge key={genre}>{genre}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='full mb-15 px-4 pb-6 md:px-6 md:pt-6 lg:p-9'>
          <p className='text-base leading-tight max-md:line-clamp-4 lg:text-xl'>
            {film.overview}
          </p>
        </div>
      </div>
    </div>
  )
}
