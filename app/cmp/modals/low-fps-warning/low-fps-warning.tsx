import { useEffect, useState } from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'

import { useMediaQuery } from '@/hk/use-media-query'
import { down, orientation } from '@/utl/mq'
import { cn } from '@/utl/tw'
import { Button } from '../../ui/button'
import {
  Drawer,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
} from '../../ui/drawer'

export const LowFpsWarning = () => {
  const landscape = useMediaQuery(orientation('landscape'))
  const isSmallScreen = useMediaQuery(down('md'))

  useEffect(() => {
    setOpen(isSmallScreen)
  }, [isSmallScreen])

  const [open, setOpen] = useState(isSmallScreen)
  return (
    <Drawer
      open={open}
      direction={landscape ? 'right' : 'bottom'}
      disablePreventScroll
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
              <DrawerTitle>Warning</DrawerTitle>
              <DrawerDescription>Low FPS detected</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button variant='outline' onClick={() => setOpen(false)}>
                Continue
              </Button>
            </DrawerFooter>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPortal>
    </Drawer>
  )
}
