import { useShallowState } from '@/store'
import { THEME } from '../../../consts'
import { reload } from '../../../utils/misc'
import { Modal } from '../../common/modal'
import { useTheme } from '../../layout'
import { Button } from '../../ui/button'
import { Label } from '../../ui/label'
import { ScrollArea } from '../../ui/scroll-area'
import { Switch } from '../../ui/switch'
import { CoreSettingsWidget } from '../../common/core-settings/core-settings-widget'
import { SmallScreenWarning } from '../../common/small-screen-warning'

export const Settings = () => {
  const {
    open,
    setOpen,
    voroforce,
    userConfig,
    setUserConfig,
    setPlayedIntro,
    voroforceDevSceneEnabled,
    setVoroforceDevSceneEnabled,
  } = useShallowState((state) => ({
    open: state.settingsOpen,
    setOpen: state.setSettingsOpen,
    voroforce: state.voroforce,
    userConfig: state.userConfig,
    setUserConfig: state.setUserConfig,
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
        innerClassName='max-h-[calc(100vh-var(--spacing)*12)]'
      >
        <div className='flex w-full flex-col gap-4 p-4 pb-18 md:gap-6 md:p-6 md:pr-10 md:pb-24 lg:pt-12 lg:pb-24'>
          <SmallScreenWarning />
          <CoreSettingsWidget onSubmit={() => window.location.reload()} />
          <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
            <div className='flex flex-row items-center gap-2'>
              <Switch
                id='light-mode'
                checked={theme === THEME.light}
                onCheckedChange={(checked) => {
                  setTheme(checked ? THEME.light : THEME.dark)
                }}
              />
              <Label htmlFor='light-mode'>Bright mode</Label>
            </div>
            <div className='flex flex-row items-center gap-2'>
              <Switch
                id='dev-tools'
                checked={Boolean(userConfig.devTools)}
                onCheckedChange={(checked) => {
                  userConfig.devTools = checked
                  setUserConfig(userConfig)
                  if (checked) {
                    voroforce.initDevTools(true)
                  } else {
                    voroforce.disposeDevTools()
                  }
                }}
              />
              <Label htmlFor='dev-tools'>Dev tools</Label>
            </div>
            <div className='flex flex-row items-center gap-2'>
              <Switch
                id='show-cell-seeds'
                checked={voroforceDevSceneEnabled}
                onCheckedChange={(checked) => {
                  setVoroforceDevSceneEnabled(checked)
                }}
              />
              <Label htmlFor='show-cell-seeds'>Cell seeds</Label>
            </div>
          </div>
        </div>
      </ScrollArea>
    </Modal>
  )
}
