import { useCallback, useEffect, useState } from 'react'

import { useMediaQuery } from '../../../hks/use-media-query'
import { orientation, up } from '../../../utls/mq'
import { useShallowState } from '../../../store'
import { VOROFORCE_PRESET } from '../../../vf'
import { PresetSelector } from '../../common/preset-selector'
import { reload } from '../../../utls/misc'
import { AppDrawer } from '../../common/app-drawer'
import { TriangleAlert } from 'lucide-react'
import { cn } from '../../../utls/tw'

export const LowFpsAlert = () => {
  const landscape = useMediaQuery(orientation('landscape'))
  const isLgScreen = useMediaQuery(up('lg'))

  const {
    performanceMonitor,
    preset,
    ticker,
    isSelectMode,
    setRecommendedPreset,
  } = useShallowState((state) => ({
    performanceMonitor: state.performanceMonitor,
    preset: state.preset,
    ticker: state.voroforce.ticker,
    isSelectMode: state.isSelectMode,
    recommendedPreset: state.recommendedPreset,
    setRecommendedPreset: state.setRecommendedPreset,
  }))

  const canLowerQuality = preset
    ? [VOROFORCE_PRESET.mid, VOROFORCE_PRESET.high].includes(preset)
    : false
  const warnOnce = !canLowerQuality

  const [isOpen, setIsOpen] = useState(false)
  const [wasOpen, setWasOpen] = useState(false)
  const [alignContentToBottom, setAlignContentToBottom] = useState(false)

  const open = useCallback(() => {
    switch (preset) {
      case VOROFORCE_PRESET.high:
        setRecommendedPreset(VOROFORCE_PRESET.mid)
        break
      case VOROFORCE_PRESET.mid:
      case VOROFORCE_PRESET.low:
        setRecommendedPreset(VOROFORCE_PRESET.low)
        break
    }

    ticker.freeze()
    setIsOpen(true)
    setWasOpen(true)
  }, [ticker, preset, setRecommendedPreset])

  useEffect(() => {
    if (performanceMonitor && !(warnOnce && wasOpen)) {
      console.log('subscribing to performance monitor')
      return performanceMonitor.subscribe({
        onDecline: () => {
          console.log('fps decline')
          open()
        },
      })
    }
  }, [performanceMonitor, wasOpen, warnOnce, open])

  useEffect(() => {
    setAlignContentToBottom(isSelectMode && isLgScreen)
  }, [isSelectMode, isLgScreen])

  return (
    <AppDrawer
      rootProps={{
        direction: landscape ? 'left' : 'bottom',
        open: isOpen,
        onClose: () => {
          setIsOpen(false)
          ticker.unfreeze()
        },
      }}
      contentProps={{
        className: cn({
          'landscape:!top-auto landscape:!bottom-0': alignContentToBottom,
        }),
      }}
      overlay={true}
    >
      <div className='p-4 md:p-6 lg:p-9'>
        <div className='flex flex-col gap-2 pt-4'>
          <div className='flex items-center gap-2 font-semibold text-xl text-zinc-900 dark:text-white'>
            <TriangleAlert className='h-5 w-5 text-amber-500 ' />
            <div>Low FPS detected</div>
          </div>
          <p className='text-base text-zinc-600 dark:text-zinc-300'>
            <span className='md:hidden'>
              This page is best viewed on a larger device like a desktop or
              laptop.
            </span>
            <span
              className={cn('max-md:hidden', {
                hidden: preset === VOROFORCE_PRESET.low,
              })}
            >
              Switch to a lower quality setting?
            </span>
            <span
              className={cn('max-md:hidden', {
                hidden: preset !== VOROFORCE_PRESET.low,
              })}
            >
              You're already using the lowest quality setting.
            </span>
          </p>
        </div>
        <PresetSelector
          onSetPreset={(newPreset: VOROFORCE_PRESET) => {
            if (newPreset !== preset) reload()
            setIsOpen(false)
          }}
        />
      </div>
    </AppDrawer>
  )
}
