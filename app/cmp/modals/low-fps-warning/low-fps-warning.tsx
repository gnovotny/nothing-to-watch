import { useEffect, useState } from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'

import { useMediaQuery } from '@/hk/use-media-query'
import { orientation } from '@/utl/mq'
import { cn } from '@/utl/tw'
import {
  Drawer,
  DrawerDescription,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
} from '../../ui/drawer'
import { store } from '../../../store'
import { useShallow } from 'zustand/react/shallow'
import { VOROFORCE_PRESET } from '../../../vf'
import { PresetSelector } from '../../common/preset-selector'

export const LowFpsWarning = () => {
  const landscape = useMediaQuery(orientation('landscape'))

  const { performanceMonitor, preset, ticker } = store(
    useShallow((state) => ({
      performanceMonitor: state.performanceMonitor,
      preset: state.preset,
      ticker: state.voroforce.ticker,
    })),
  )

  const canLowerQuality = preset
    ? [VOROFORCE_PRESET.mid, VOROFORCE_PRESET.high].includes(preset)
    : false
  const warnOnce = !canLowerQuality

  const [open, setOpen] = useState(false)
  const [wasOpen, setWasOpen] = useState(false)

  useEffect(() => {
    if (performanceMonitor && !(warnOnce && wasOpen)) {
      console.log('subscribing to performance monitor')
      return performanceMonitor.subscribe({
        onDecline: () => {
          ticker.freeze()
          console.log('on decline')
          setOpen(true)
          setWasOpen(true)
        },
      })
    }
  }, [performanceMonitor, wasOpen, warnOnce, ticker])

  return (
    <Drawer
      open={open}
      direction={landscape ? 'right' : 'bottom'}
      disablePreventScroll
      onClose={() => {
        setOpen(false)
        ticker.unfreeze()
      }}
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
            <PresetSelector
              onSetPreset={(newPreset: VOROFORCE_PRESET) => {
                if (newPreset !== preset) {
                  window.location.reload()
                }
              }}
            />
            {/*<DrawerFooter>*/}
            {/*  <Button variant='outline' onClick={() => setOpen(false)}>*/}
            {/*    Continue*/}
            {/*  </Button>*/}
            {/*</DrawerFooter>*/}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPortal>
    </Drawer>
  )
}
