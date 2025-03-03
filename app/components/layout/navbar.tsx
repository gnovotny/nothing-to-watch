import { GithubIcon, Settings } from 'lucide-react'
import { useVoroforce } from '../../lib/voroforce'
import { Button } from '../ui/button'
import { ThemeToggle } from './theme'
import config from '../../config'

export const Navbar = () => {
  const setSettingsOpen = useVoroforce((state) => state.setSettingsOpen)
  const settingsOpen = useVoroforce((state) => state.settingsOpen)

  return (
    <div className='fixed inset-x-0 top-0 z-10 flex w-full flex-row items-center justify-end gap-1 p-6 lg:p-9'>
      <ThemeToggle className='!size-8 [&_svg]:!size-6 pointer-events-auto rounded-full' />
      <Button
        variant='ghost'
        size='icon'
        asChild
        className='!size-8 [&_svg]:!size-6 pointer-events-auto rounded-full'
      >
        <a href={config.githubUrl} target='_blank' rel='noopener noreferrer'>
          <GithubIcon />
        </a>
      </Button>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => {
          setSettingsOpen(!settingsOpen)
        }}
        className='!size-8 [&_svg]:!size-6 pointer-events-auto rounded-full'
      >
        <Settings />
      </Button>
    </div>
  )
}
