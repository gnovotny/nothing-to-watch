import { HeartOff, HeartPlus, Plus } from 'lucide-react'
import { useShallowState } from '../../../../../store'
import { cn } from '../../../../../utils/tw'
import type { Film } from '../../../../../vf'
import { CustomLinks } from '../../../../common/custom-links'
import { StdLinks } from '../../../../common/standard-links'
import { Button } from '../../../../ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../ui/tooltip'

export const FilmViewFooter = ({
  film,
  className = '',
}: { film?: Film; className?: string }) => {
  const {
    userConfig,
    setUserConfig,
    exitVoroforceSelectMode,
    isFavorite,
    toggleNewLinkTypeOpen,
  } = useShallowState((state) => ({
    userConfig: state.userConfig,
    setUserConfig: state.setUserConfig,
    exitVoroforceSelectMode: state.exitSelectMode,
    isFavorite: film && state.userConfig?.favorites?.[film.tmdbId],
    toggleNewLinkTypeOpen: state.toggleNewLinkTypeOpen,
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
      <div className={cn('pointer-events-auto flex flex-row gap-3')}>
        <StdLinks film={film} />
        <CustomLinks film={film} />
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='icon'
                className={cn(
                  'hidden cursor-pointer rounded-lg border-foreground md:inline-flex md:backdrop-blur-lg',
                )}
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
