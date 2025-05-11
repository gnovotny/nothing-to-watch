import { useCallback, useEffect, useRef, useState } from 'react'

import { useMediaQuery } from '../../../hks/use-media-query'
import { orientation, up } from '../../../utls/mq'
import { useShallowState } from '../../../store'
import { VOROFORCE_PRESET } from '../../../vf'
import { PresetSelector } from '../../common/preset-selector'
import { reload } from '../../../utls/misc'
import { Modal } from '../../common/modal'
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
    setAboutOpen,
    setSettingsOpen,
  } = useShallowState((state) => ({
    performanceMonitor: state.performanceMonitor,
    preset: state.preset,
    ticker: state.voroforce.ticker,
    isSelectMode: state.isSelectMode,
    recommendedPreset: state.recommendedPreset,
    setRecommendedPreset: state.setRecommendedPreset,
    setAboutOpen: state.setAboutOpen,
    setSettingsOpen: state.setSettingsOpen,
  }))

  const canLowerQuality = preset
    ? [VOROFORCE_PRESET.mid, VOROFORCE_PRESET.high].includes(preset)
    : false
  const warnLimit = !canLowerQuality ? 1 : 2

  const [isOpen, setIsOpen] = useState(false)
  const [openedCount, setOpenedCount] = useState(0)
  const [alignContentToBottom, setAlignContentToBottom] = useState(false)
  const [cooldown, setCooldown] = useState(true)

  const cooldownTimeoutRef = useRef<NodeJS.Timeout>(null)

  const open = useCallback(() => {
    if (cooldown) {
      if (!cooldownTimeoutRef.current) {
        setTimeout(() => {
          setCooldown(false)
          cooldownTimeoutRef.current = null
        }, 30000)
      }
      return
    }
    if (!isLgScreen) {
      setAboutOpen(false)
      setSettingsOpen(false)
    }

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
    setOpenedCount((opened) => opened + 1)
    setCooldown(true)
  }, [
    ticker,
    preset,
    setRecommendedPreset,
    isLgScreen,
    setAboutOpen,
    setSettingsOpen,
    cooldown,
  ])

  const close = useCallback(() => {
    setIsOpen(false)
    ticker.unfreeze()
  }, [ticker])

  useEffect(() => {
    if (performanceMonitor && openedCount < warnLimit) {
      return performanceMonitor.subscribe({
        onDecline: () => {
          console.log('fps decline')
          open()
        },
      })
    }
  }, [performanceMonitor, openedCount, warnLimit, open])

  useEffect(() => {
    setAlignContentToBottom(isSelectMode && isLgScreen)
  }, [isSelectMode, isLgScreen])

  return (
    <Modal
      rootProps={{
        direction: landscape ? 'left' : 'bottom',
        open: isOpen,
        onClose: close,
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
          <p className='inline-flex text-base text-zinc-600 max-md:pb-2 dark:text-zinc-300'>
            <span className='leading-none md:hidden'>
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
            if (newPreset !== preset) {
              reload()
            } else {
              close()
            }
          }}
        />
      </div>
    </Modal>
  )
}
