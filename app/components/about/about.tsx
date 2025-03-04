import { useMediaQuery } from '@/hooks/use-media-query'
import { orientation } from '@/lib/utils/mq'
import { Drawer as DrawerPrimitive } from 'vaul'
import { cn } from '../../lib/utils/tw'
import { useVoroforce } from '../../lib/voroforce'
import { Button } from '../ui/button'
import {
  Drawer,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
} from '../ui/drawer'
import { useShallow } from 'zustand/react/shallow'
import config from '../../config'
import { GithubIcon } from 'lucide-react'

export const About = () => {
  const landscape = useMediaQuery(orientation('landscape'))

  const { open, setOpen } = useVoroforce(
    useShallow((state) => ({
      open: state.aboutOpen,
      setOpen: state.setAboutOpen,
    })),
  )

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
              <DrawerTitle>About</DrawerTitle>
              {/*<DrawerDescription>Settings</DrawerDescription>*/}
            </DrawerHeader>
            <div className='flex flex-col gap-3 p-4 pb-0'>
              <Button
                variant='ghost'
                size='icon'
                asChild
                className='!size-8 [&_svg]:!size-6 pointer-events-auto rounded-full'
              >
                <a
                  href={config.githubUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <GithubIcon />
                </a>
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
