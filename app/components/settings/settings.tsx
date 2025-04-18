import { useMediaQuery } from '@/hooks/use-media-query'
import { orientation } from '../../utils/mq'
import { Drawer as DrawerPrimitive } from 'vaul'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '../../utils/tw'
import { useVoroforce } from '../../voroforce'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  Drawer,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
} from '../ui/drawer'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'

const NUM_CELL_OPTIONS = [5000, 25000, 50000]

export const Settings = () => {
  const landscape = useMediaQuery(orientation('landscape'))

  const { open, setOpen, userConfig, setVConfig, setPlayedIntro } =
    useVoroforce(
      useShallow((state) => ({
        open: state.settingsOpen,
        setOpen: state.setSettingsOpen,
        userConfig: state.userConfig,
        setVConfig: state.setUserConfig,
        setPlayedIntro: state.setPlayedIntro,
      })),
    )

  const forceHigherQuality = useVoroforce(
    (state) => state.userConfig.forceHigherQuality,
  )

  const noPostEffects = useVoroforce((state) => state.userConfig.noPostEffects)

  const reload = () => window.location.reload()

  return (
    <Drawer
      open={open}
      direction={landscape ? 'right' : 'bottom'}
      disablePreventScroll
      shouldScaleBackground={false}
      onClose={() => setOpen(false)}
    >
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerPrimitive.Content
          className={cn(
            '!pointer-events-auto fixed not-landscape:inset-x-0 not-landscape:bottom-0 z-50 not-landscape:mt-24 flex not-landscape:h-auto not-landscape:flex-col not-landscape:rounded-t-lg border bg-background landscape:inset-y landscape:top-0 landscape:right-0 landscape:h-full landscape:flex-row landscape:rounded-l-lg',
          )}
        >
          <div className='not-landscape:mx-auto not-landscape:mt-4 not-landscape:h-2 not-landscape:w-[100px] rounded-full bg-muted landscape:my-auto landscape:ml-4 landscape:h-[100px] landscape:w-2' />
          <div className='not-landscape:w-full landscape:h-full'>
            <DrawerHeader>
              <DrawerTitle>Settings</DrawerTitle>
              {/*<DrawerDescription>Settings</DrawerDescription>*/}
            </DrawerHeader>
            <div className='flex flex-col gap-3 p-4 pb-0'>
              <div className='flex flex-col gap-1'>
                <div>Movie limit</div>
                <div className='flex flex-row gap-1'>
                  {NUM_CELL_OPTIONS.map((option) => (
                    <Badge
                      key={option}
                      onClick={() => {
                        userConfig.cells = option
                        setVConfig(userConfig)
                        reload()
                      }}
                      className={cn({
                        'bg-primary/80': userConfig.cells !== option,
                      })}
                    >
                      {option}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className='flex flex-col gap-1'>
                <div className='flex flex-row gap-1'>
                  <Switch
                    id='higher-quality'
                    checked={Boolean(forceHigherQuality)}
                    onCheckedChange={(checked) => {
                      userConfig.forceHigherQuality = checked
                      setVConfig(userConfig)
                    }}
                  />
                  <Label htmlFor='higher-quality'>Force higher quality</Label>
                </div>
                <div className='flex flex-row gap-1'>
                  <Switch
                    id='no-post-effects'
                    checked={Boolean(noPostEffects)}
                    onCheckedChange={(checked) => {
                      userConfig.noPostEffects = checked
                      setVConfig(userConfig)
                      reload()
                    }}
                  />
                  <Label htmlFor='no-post-effects'>No post effects</Label>
                </div>
              </div>
              <Button
                onClick={() => {
                  setPlayedIntro(false)
                  reload()
                }}
              >
                Replay Intro
              </Button>
            </div>
            <DrawerFooter>
              <Button variant='outline' onClick={() => setOpen(false)}>
                Close
              </Button>
            </DrawerFooter>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPortal>
    </Drawer>
  )
}
