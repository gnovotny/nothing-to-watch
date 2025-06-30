import { useCallback, useEffect, useRef, useState } from 'react'

import { TriangleAlert } from 'lucide-react'
import { useMediaQuery } from '../../../hks/use-media-query'
import { useShallowState } from '../../../store'
import { orientation, up } from '../../../utls/mq'
import { cn } from '../../../utls/tw'
import { VOROFORCE_PRESET } from '../../../vf'
import { Modal } from '../../common/modal'
import { DEVICE_CLASS } from '../../../vf/consts'
import { CoreSettingsWidget } from '../../common/core-settings-widget'

export const LowFpsAlert = () => {
  const landscape = useMediaQuery(orientation('landscape'))
  const isLgScreen = useMediaQuery(up('lg'))

  const {
    performanceMonitor,
    preset,
    ticker,
    isSelectMode,
    estimatedDeviceClass,
    setEstimatedDeviceClass,
    setAboutOpen,
    setSettingsOpen,
    cellLimit,
  } = useShallowState((state) => ({
    performanceMonitor: state.performanceMonitor,
    preset: state.preset,
    ticker: state.voroforce.ticker,
    isSelectMode: state.isSelectMode,
    estimatedDeviceClass: state.estimatedDeviceClass,
    setEstimatedDeviceClass: state.setEstimatedDeviceClass,
    setAboutOpen: state.setAboutOpen,
    setSettingsOpen: state.setSettingsOpen,
    cellLimit: state.userConfig.cells,
  }))

  const canLowerQuality = preset
    ? [VOROFORCE_PRESET.contours, VOROFORCE_PRESET.depth].includes(preset) ||
      (cellLimit && cellLimit > 10000)
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

    switch (estimatedDeviceClass) {
      case DEVICE_CLASS.high:
        setEstimatedDeviceClass(DEVICE_CLASS.mid)
        break
      case DEVICE_CLASS.mid:
      case DEVICE_CLASS.low:
        setEstimatedDeviceClass(DEVICE_CLASS.low)
        break
    }

    ticker.freeze()
    setIsOpen(true)
    setOpenedCount((opened) => opened + 1)
    setCooldown(true)
  }, [
    ticker,
    estimatedDeviceClass,
    setEstimatedDeviceClass,
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
                hidden: preset === VOROFORCE_PRESET.minimal,
              })}
            >
              Switch to a lower quality setting?
            </span>
            <span
              className={cn('max-md:hidden', {
                hidden: preset !== VOROFORCE_PRESET.minimal,
              })}
            >
              You're already using the fastest preset.
            </span>
          </p>
        </div>
        <CoreSettingsWidget onSubmit={() => window.location.reload()} />
      </div>
    </Modal>
  )
}
