import { Button } from '../../ui/button'
import { useShallowState } from '@/store'
import { ScrollArea } from '../../ui/scroll-area'
import { AppDrawer } from '../../common/app-drawer'
import { PresetSelector } from '../../common/preset-selector'
import { Infinity, Settings as SettingsIcon, TriangleAlert } from 'lucide-react'
import type { VOROFORCE_PRESET } from '../../../vf'
import { reload } from '../../../utls/misc'
import { Badge } from '../../ui/badge'
import { cn } from '../../../utls/tw'
import { Switch } from '../../ui/switch'
import { Label } from '../../ui/label'

const NUM_CELL_OPTIONS = [5000, 10000, 25000, 50000, 100000]

export const Settings = () => {
  const { open, setOpen, preset, userConfig, setVConfig, setPlayedIntro } =
    useShallowState((state) => ({
      open: state.settingsOpen,
      setOpen: state.setSettingsOpen,
      preset: state.preset,
      userConfig: state.userConfig,
      setVConfig: state.setUserConfig,
      setPlayedIntro: state.setPlayedIntro,
    }))

  return (
    <AppDrawer
      rootProps={{
        open: open,
        onClose: () => setOpen(false),
      }}
      overlay
      footer={
        <div className='flex w-full flex-row justify-between gap-3 p-6 md:gap-6'>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      }
    >
      <ScrollArea
        className='not-landscape:w-full not-landscape:rounded-t-3xl bg-background/60 lg:w-full lg:rounded-3xl landscape:h-full landscape:rounded-l-3xl'
        innerClassName='max-h-[calc(100vh-var(--spacing)*6*2)]'
      >
        <div className='flex w-full flex-col gap-6 p-6 pr-10 lg:pt-12 lg:pb-24'>
          <div>
            <div className='hidden md:block'>
              <div className='flex items-center gap-2 font-semibold text-xl text-zinc-900 dark:text-white'>
                <SettingsIcon className='h-5 w-5 text-zinc-900 dark:text-white' />
                Quality Settings
              </div>
            </div>
            <div className='flex flex-col gap-2 py-4 md:hidden'>
              <div className='flex items-center gap-2 font-semibold text-xl text-zinc-900 dark:text-white'>
                <TriangleAlert className='h-5 w-5 text-amber-500 ' />
                <div>Warning</div>
              </div>
              <p className='text-base text-zinc-600 dark:text-zinc-300'>
                This page is best viewed on a larger device like a desktop or
                laptop.
              </p>
            </div>
            <PresetSelector
              onSetPreset={(newPreset: VOROFORCE_PRESET) => {
                if (newPreset !== preset) reload()
              }}
              submitLabel='Apply'
            />
          </div>
          <div className='flex flex-col gap-1'>
            <div className='flex items-center gap-2 font-semibold text-xl text-zinc-900 dark:text-white'>
              <Infinity className='h-5 w-5 text-zinc-900 dark:text-white' />
              Cell limit override
            </div>
            <div className='flex flex-row gap-1'>
              {NUM_CELL_OPTIONS.map((option) => (
                <Badge
                  key={option}
                  onClick={() => {
                    userConfig.cells = option
                    setVConfig(userConfig)
                    reload()
                  }}
                  className={cn('cursor-pointer hover:bg-primary', {
                    'bg-primary/80': userConfig.cells !== option,
                  })}
                >
                  {option}
                </Badge>
              ))}
            </div>
          </div>
          <Button
            size='lg'
            className='text-lg'
            onClick={() => {
              setPlayedIntro(false)
              reload()
            }}
          >
            Replay Intro
          </Button>
          <div className='flex flex-row items-center gap-2'>
            <Switch
              id='dev-mode'
              // checked={Boolean(noPostEffects)}
              onCheckedChange={(checked) => {
                userConfig.noPostEffects = checked
                setVConfig(userConfig)
                reload()
              }}
            />
            <Label htmlFor='dev-mode'>Dev Mode</Label>
          </div>
        </div>
      </ScrollArea>
    </AppDrawer>
  )
}
