import { useShallowState } from '@/store'
import { Modal } from '../../common/modal'
import { Button } from '../../ui/button'
import { ScrollArea } from '../../ui/scroll-area'
import { CustomLinks } from '../../common/custom-links'
import { FilmPoster } from '../film/shared/film-poster'
import { Trash } from 'lucide-react'

export const Favorites = () => {
  const { open, setOpen, userConfig, setUserConfig, favorites } =
    useShallowState((state) => ({
      open: state.favoritesOpen,
      setOpen: state.setFavoritesOpen,
      userConfig: state.userConfig,
      setUserConfig: state.setUserConfig,
      favorites: state.userConfig.favorites,
    }))

  const hasFavorites = favorites && Object.keys(favorites).length > 0

  return (
    <Modal
      rootProps={{
        open: open,
        onClose: () => setOpen(false),
      }}
      overlay
      footer={
        <div className='flex w-full flex-row justify-between gap-3 p-4 md:gap-6 md:p-6'>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Close
          </Button>
          {hasFavorites && (
            <Button
              variant='outline'
              onClick={() => {
                userConfig.favorites = undefined
                setUserConfig(userConfig)
              }}
            >
              Reset
            </Button>
          )}
        </div>
      }
    >
      <ScrollArea
        className='not-landscape:w-full bg-background/60 lg:w-full landscape:h-full'
        innerClassName='max-h-[calc(100vh-var(--spacing)*12)]'
      >
        <div className='flex min-h-64 w-full flex-col gap-4 p-4 pb-18 md:grid md:grid-cols-2 md:gap-6 md:p-6 md:pb-24 lg:pt-16 lg:pb-24'>
          {userConfig.favorites ? (
            <>
              {Object.entries(userConfig.favorites).map(([key, film]) => (
                <div
                  className='relative flex h-36 w-full cursor-auto flex-row overflow-hidden rounded-xl border'
                  key={key}
                >
                  <FilmPoster film={film} />
                  <div className='flex h-full grow flex-col justify-between gap-3 p-4'>
                    <h6 className='pr-3 font-black text-2xl leading-none'>
                      {film.title}
                    </h6>
                    <CustomLinks
                      film={film}
                      addNewDisabled
                      buttonClassName='text-xxs !py-1 !px-2 !h-auto'
                      className='flex-wrap gap-1.5'
                    />
                  </div>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='!size-4 [&_svg]:!size-3 absolute top-2 right-2 cursor-pointer rounded-full'
                    onClick={() => {
                      delete favorites?.[Number.parseInt(key)]
                      userConfig.favorites = { ...favorites }
                      setUserConfig(userConfig)
                    }}
                  >
                    <Trash />
                  </Button>
                </div>
              ))}
            </>
          ) : (
            <div className='flex h-full w-full flex-1 items-center justify-center text-lg'>
              No favourites
            </div>
          )}
        </div>
      </ScrollArea>
    </Modal>
  )
}
