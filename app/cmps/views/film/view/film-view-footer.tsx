import { useShallowState } from '@/store'
import type { Film } from '@/vf'
import { HeartOff, HeartPlus } from 'lucide-react'
import { cn } from '../../../../utils/tw'
import { Button } from '../../../ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../ui/tooltip'
import { CustomLinks } from '../../../common/custom-links'

export const FilmViewFooter = ({
  film,
  className = '',
}: { film?: Film; className?: string }) => {
  const { userConfig, setUserConfig, exitVoroforceSelectMode, isFavorite } =
    useShallowState((state) => ({
      userConfig: state.userConfig,
      setUserConfig: state.setUserConfig,
      exitVoroforceSelectMode: state.exitSelectMode,
      isFavorite: film && state.userConfig?.favorites?.[film.tmdbId],
    }))

  if (!film) return
  return (
    <div
      className={cn(
        'relative flex w-full flex-row justify-between gap-3 px-4 py-6 md:gap-6 md:p-6 lg:p-6 xl:p-9',
        className,
        {},
      )}
    >
      <CustomLinks film={film} />
      <div className='pointer-events-auto flex flex-row gap-3'>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='icon'
                variant={isFavorite ? 'default' : 'outline'}
                onClick={() => {
                  if (isFavorite) {
                    delete userConfig.favorites?.[film.tmdbId]
                  } else {
                    if (!userConfig.favorites) userConfig.favorites = {}
                    userConfig.favorites[film.tmdbId] = {
                      imdbId: film.imdbId,
                      tmdbId: film.tmdbId,
                      title: film.title,
                      poster: film.poster,
                    }
                  }
                  setUserConfig(userConfig)
                }}
                className='pointer-events-auto hidden rounded-lg border-foreground backdrop-blur-lg md:inline-flex'
              >
                {isFavorite ? <HeartOff /> : <HeartPlus />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFavorite ? 'Remove from favorites' : 'Add to favorites'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          variant='outline'
          onClick={exitVoroforceSelectMode}
          className='pointer-events-auto rounded-lg border-foreground backdrop-blur-lg md:w-36'
        >
          Close
        </Button>
      </div>
    </div>
  )
}
