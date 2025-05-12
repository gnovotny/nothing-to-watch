import { Button } from '../../ui/button'
import { useShallowState } from '@/store'
import { ScrollArea } from '../../ui/scroll-area'
import { Modal } from '../../common/modal'
import { PresetSelector } from '../../common/preset-selector'
import {
  InfinityIcon,
  Settings as SettingsIcon,
  TriangleAlert,
} from 'lucide-react'
import type { VOROFORCE_PRESET } from '../../../vf'
import { reload } from '../../../utls/misc'
import { Badge } from '../../ui/badge'
import { cn } from '../../../utls/tw'
import { Switch } from '../../ui/switch'
import { Label } from '../../ui/label'
import { useTheme } from '../../layout'
import { THEME } from '../../../consts'

const NUM_CELL_OPTIONS = [5000, 10000, 25000, 50000, 100000]

export const Settings = () => {
  const {
    open,
    setOpen,
    preset,
    userConfig,
    setVConfig,
    setPlayedIntro,
    voroforceDevSceneEnabled,
    setVoroforceDevSceneEnabled,
  } = useShallowState((state) => ({
    open: state.settingsOpen,
    setOpen: state.setSettingsOpen,
    preset: state.preset,
    userConfig: state.userConfig,
    setVConfig: state.setUserConfig,
    setPlayedIntro: state.setPlayedIntro,
    voroforceDevSceneEnabled: state.voroforceDevSceneEnabled,
    setVoroforceDevSceneEnabled: state.setVoroforceDevSceneEnabled,
  }))

  const { theme, setTheme } = useTheme()

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
          <Button
            variant='outline'
            onClick={() => {
              setPlayedIntro(false)
              reload()
            }}
          >
            Replay Intro
          </Button>
        </div>
      }
    >
      <ScrollArea
        className='not-landscape:w-full bg-background/60 lg:w-full landscape:h-full'
        innerClassName='max-h-[calc(100vh-var(--spacing)*6*2)]'
      >
        <div className='flex w-full flex-col gap-4 p-4 pb-18 md:gap-6 md:p-6 md:pr-10 md:pb-24 lg:pt-12 lg:pb-24'>
          <div>
            <div className='hidden md:block'>
              <div className='flex items-center gap-2 font-semibold text-xl text-zinc-900 dark:text-white'>
                <SettingsIcon className='h-5 w-5 text-zinc-900 dark:text-white' />
                Quality Settings
              </div>
            </div>
            <div className='flex flex-col gap-2 md:hidden'>
              <div className='flex items-center gap-2 font-semibold text-xl text-zinc-900 dark:text-white'>
                <TriangleAlert className='h-5 w-5 text-amber-500 ' />
                <div>Warning</div>
              </div>
              <p className='text-base text-zinc-600 leading-none dark:text-zinc-300'>
                This page is best viewed on a larger device like a desktop or
                laptop.
              </p>
            </div>
            <PresetSelector
              onSetPreset={(newPreset: VOROFORCE_PRESET) => {
                if (newPreset !== preset) reload()
              }}
              submitLabel='Apply'
              submitProps={{
                size: 'default',
                className: 'text-base leading-none',
              }}
              className='max-md:hidden'
            />
          </div>
          <div className='flex flex-col gap-1'>
            <div className='flex items-center gap-2 font-semibold text-base text-zinc-900 md:text-xl dark:text-white'>
              <InfinityIcon className='h-5 w-5 text-zinc-900 dark:text-white' />
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
                    'max-md:hidden': option > 25000,
                  })}
                >
                  {option}
                </Badge>
              ))}
            </div>
          </div>
          <div className='flex flex-row items-center gap-2'>
            <Switch
              id='light-mode'
              checked={theme === THEME.light}
              onCheckedChange={(checked) => {
                setTheme(checked ? THEME.light : THEME.dark)
              }}
            />
            <Label htmlFor='light-mode'>Light Mode</Label>
          </div>
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
            <Label htmlFor='dev-mode'>Show Dev Widget</Label>
          </div>
          <div className='flex flex-row items-center gap-2'>
            <Switch
              id='show-cell-seeds'
              checked={voroforceDevSceneEnabled}
              onCheckedChange={(checked) => {
                setVoroforceDevSceneEnabled(checked)
              }}
            />
            <Label htmlFor='show-cell-seeds'>Show Cell Seeds</Label>
          </div>
        </div>
      </ScrollArea>
    </Modal>
  )
}
