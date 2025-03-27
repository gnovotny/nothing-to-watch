import { Info, Settings } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useVoroforce } from '../../voroforce'
import { Button } from '../ui/button'
import { ThemeToggle } from './theme'

export const Navbar = () => {
  const { settingsOpen, setSettingsOpen, aboutOpen, setAboutOpen } =
    useVoroforce(
      useShallow((state) => ({
        settingsOpen: state.settingsOpen,
        setSettingsOpen: state.setSettingsOpen,
        aboutOpen: state.aboutOpen,
        setAboutOpen: state.setAboutOpen,
      })),
    )

  return (
    <div className='fixed inset-x-0 top-0 z-10 flex w-full flex-row items-center justify-end gap-1 p-6 lg:p-9'>
      <ThemeToggle className='!size-8 [&_svg]:!size-6 pointer-events-auto rounded-full' />
      <Button
        variant='ghost'
        size='icon'
        onClick={() => {
          setAboutOpen(!aboutOpen)
        }}
        className='!size-8 [&_svg]:!size-6 pointer-events-auto rounded-full'
      >
        <Info />
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
