import slugify from 'slugify'

import config from '@/config'
import { cn } from '../../../../utls/tw'
import type { Film } from '@/vf'
import { Copy, Plus, X } from 'lucide-react'
import { Button } from '../../../ui/button'
import { useShallowState } from '@/store'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../ui/tooltip'
import { useState } from 'react'

export const FilmViewFooter = ({
  film,
  className = '',
}: { film?: Film; className?: string }) => {
  const {
    userConfig,
    setUserConfig,
    customLinks,
    exitVoroforceSelectMode,
    toggleNewLinkTypeOpen,
  } = useShallowState((state) => ({
    userConfig: state.userConfig,
    setUserConfig: state.setUserConfig,
    customLinks: state.userConfig.customLinks,
    exitVoroforceSelectMode: state.exitSelectMode,
    toggleNewLinkTypeOpen: state.toggleNewLinkTypeOpen,
  }))

  const [copiedCustomLink, setCopiedCustomLink] = useState(false)

  if (!film) return
  return (
    <div
      className={cn(
        'relative flex w-full flex-row justify-between gap-3 px-4 py-6 md:gap-6 md:p-6 lg:p-6 xl:p-9',
        className,
        {},
      )}
    >
      <div className='pointer-events-auto flex flex-row gap-3'>
        <Button
          asChild
          variant='outline'
          className='rounded-lg border-foreground md:backdrop-blur-lg'
        >
          <a
            href={`${config.tmdbFilmBaseUrl}${film.tmdbId}`}
            target='_blank'
            rel='noreferrer'
          >
            TMDB
          </a>
        </Button>
        {film.imdbId && (
          <Button
            asChild
            variant='outline'
            className='rounded-lg border-foreground md:backdrop-blur-lg'
          >
            <a
              href={`${config.imdbFilmBaseUrl}${film.imdbId}`}
              target='_blank'
              rel='noreferrer'
            >
              IMDB
            </a>
          </Button>
        )}
        <TooltipProvider delayDuration={0}>
          {customLinks?.map(({ name, baseUrl, slug, property }, index) => (
            <Button
              asChild
              key={baseUrl}
              variant='outline'
              className='rounded-lg border-foreground md:backdrop-blur-lg'
            >
              <div className='group relative'>
                <a
                  href={`${baseUrl}${(slug ? (v: string) => slugify(v).toLowerCase() : (v: string) => v)(String(film[property]))}`}
                  target='_blank'
                  rel='noreferrer noopener'
                >
                  {name}
                </a>

                <Tooltip>
                  <TooltipTrigger
                    onClick={(event) => {
                      event.preventDefault()
                    }}
                    className='-bottom-2 -end-2 absolute inline-flex size-5 items-center justify-center rounded-full border border-white bg-blue-500 font-bold text-white text-xs opacity-0 transition-opacity duration-300 group-hover:opacity-100'
                  >
                    <Copy
                      onClick={() => {
                        void navigator?.clipboard?.writeText(
                          `${window.location.href.split('?')[0]}?customLinkBase64=${window.btoa(JSON.stringify({ name, baseUrl, slug, property }))}`,
                        )
                        setCopiedCustomLink(true)
                        setTimeout(() => setCopiedCustomLink(false), 2000)
                      }}
                      className='!size-3'
                    />
                  </TooltipTrigger>
                  <TooltipContent
                    // onPointerDownOutside={(event) => {
                    //   event.preventDefault()
                    // }}
                    onPointerDownOutside={(event) => {
                      // if (event.target === triggerRef.current)
                      event.preventDefault()
                    }}
                    side='bottom'
                  >
                    {copiedCustomLink ? (
                      <p>Copied!</p>
                    ) : (
                      <p>Copy to Clipboard for sharing</p>
                    )}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size='icon'
                      variant='unstyled'
                      className='-top-2 -end-2 absolute inline-flex size-5 items-center justify-center rounded-full border border-white bg-red-500 font-bold text-white text-xs opacity-0 transition-opacity duration-300 group-hover:opacity-100 '
                      onClick={() => {
                        userConfig.customLinks?.splice(index, 1)
                        userConfig.customLinks = [
                          ...(userConfig.customLinks ?? []),
                        ]
                        setUserConfig(userConfig)
                      }}
                    >
                      <X className='!size-3' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Remove</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </Button>
          ))}
          {/*<AddCustomLink />*/}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='icon'
                className='hidden cursor-pointer rounded-lg border-foreground md:inline-flex md:backdrop-blur-lg'
                variant='outline'
                onClick={toggleNewLinkTypeOpen}
              >
                <Plus />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add new link type</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Button
        variant='outline'
        onClick={exitVoroforceSelectMode}
        className='pointer-events-auto w-36 rounded-lg border-foreground backdrop-blur-lg'
      >
        Close
      </Button>
    </div>
  )
}
