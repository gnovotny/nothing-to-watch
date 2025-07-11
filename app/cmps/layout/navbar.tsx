import { GithubIcon, Heart, Info, Settings } from 'lucide-react'

import { useShallowState } from '@/store'
import config from '../../config'
import { cn } from '../../utils/tw'
import { Button } from '../ui/button'
import { ThemeToggle } from './theme'

export const Navbar = () => {
  const {
    settingsOpen,
    toggleSettingsOpen,
    aboutOpen,
    toggleAboutOpen,
    favoritesOpen,
    toggleFavoritesOpen,
    hasFavorites,
  } = useShallowState((state) => ({
    settingsOpen: state.settingsOpen,
    toggleSettingsOpen: state.toggleSettingsOpen,
    aboutOpen: state.aboutOpen,
    toggleAboutOpen: state.toggleAboutOpen,
    favoritesOpen: state.favoritesOpen,
    toggleFavoritesOpen: state.toggleFavoritesOpen,
    hasFavorites:
      state.userConfig.favorites &&
      Object.keys(state.userConfig.favorites).length > 0,
  }))

  const buttonClassnames =
    '!size-6 [&_svg]:!size-4 lg:!size-8 lg:[&_svg]:!size-5 pointer-events-auto rounded-full cursor-pointer'

  return (
    <div className='pointer-events-none fixed inset-x-0 bottom-0 z-10 flex w-full flex-row items-center justify-between gap-1 p-3 lg:top-0 lg:bottom-auto lg:z-60 lg:justify-end lg:px-9 lg:py-9'>
      <Button
        variant='ghost'
        size='icon'
        onClick={toggleAboutOpen}
        onPointerDown={(event) => {
          if (aboutOpen) {
            event.preventDefault()
            event.stopPropagation()
          }
        }}
        className={cn(buttonClassnames, {
          'border border-foreground': aboutOpen,
        })}
      >
        <Info />
      </Button>
      <div className='flex flex-row gap-1'>
        <Button
          variant='ghost'
          size='icon'
          onClick={toggleSettingsOpen}
          onPointerDown={(event) => {
            if (settingsOpen) {
              event.preventDefault()
              event.stopPropagation()
            }
          }}
          className={cn(buttonClassnames, {
            'border border-foreground': settingsOpen,
          })}
        >
          <Settings />
        </Button>
        {hasFavorites && (
          <Button
            variant='ghost'
            size='icon'
            onClick={toggleFavoritesOpen}
            onPointerDown={(event) => {
              if (favoritesOpen) {
                event.preventDefault()
                event.stopPropagation()
              }
            }}
            className={cn(buttonClassnames, {
              'border border-foreground': favoritesOpen,
            })}
          >
            <Heart />
          </Button>
        )}
      </div>

      <ThemeToggle
        className={cn(buttonClassnames, 'hidden lg:inline-flex')}
        onPointerDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
        }}
      />
      <Button
        variant='ghost'
        size='icon'
        onClick={toggleSettingsOpen}
        onPointerDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
        }}
        className={cn(buttonClassnames, 'hidden lg:inline-flex')}
      >
        <a
          href={config.sourceCodeUrl}
          target='_blank'
          rel='noreferrer noopener noreferer'
        >
          <GithubIcon />
        </a>
      </Button>
    </div>
  )
}
