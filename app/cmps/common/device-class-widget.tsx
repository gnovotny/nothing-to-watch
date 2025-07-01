import { type ReactNode, useState } from 'react'

import { useMediaQuery } from '../../hks/use-media-query'
import { useShallowState } from '../../store'
import { down } from '../../utls/mq'
import { cn } from '../../utls/tw'
import { Button, type ButtonProps } from '../ui/button'
import { type DEVICE_CLASS, DEVICE_CLASS_ITEMS } from '@/vf/consts.ts'
import { isDefined } from '../../utls/misc'
import { DeviceClassSelector } from './device-class-selector'

export function DeviceClassWidget({
  className = '',
  onSubmit,
  submitLabel = 'Continue',
  submitProps,
}: {
  className?: string
  onSubmit?: () => void
  submitLabel?: string | ReactNode
  submitProps?: ButtonProps
}) {
  const { estimatedDeviceClass, setStoreDeviceClass, storeDeviceClass } =
    useShallowState((state) => ({
      setStoreDeviceClass: state.setDeviceClass,
      estimatedDeviceClass: state.estimatedDeviceClass,
      storeDeviceClass: state.deviceClass,
    }))

  const isSmallScreen = useMediaQuery(down('md'))

  const [selectedDeviceClass, setSelectedDeviceClass] = useState<
    DEVICE_CLASS | undefined
  >(
    storeDeviceClass ??
      (isSmallScreen ||
      DEVICE_CLASS_ITEMS.find((p) => p.id === estimatedDeviceClass)
        ? estimatedDeviceClass
        : undefined),
  )

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <DeviceClassSelector
        value={selectedDeviceClass}
        onValueChange={(value: DEVICE_CLASS) => {
          setSelectedDeviceClass(value)
        }}
      />
      <Button
        onClick={() => {
          const deviceClass = isDefined(selectedDeviceClass)
            ? selectedDeviceClass
            : estimatedDeviceClass
          if (deviceClass) {
            setStoreDeviceClass(deviceClass)
            onSubmit?.()
          }
        }}
        size='lg'
        disabled={!isSmallScreen && !selectedDeviceClass}
        {...submitProps}
        className={cn('w-full cursor-pointer text-lg', submitProps?.className)}
      >
        {submitLabel}
      </Button>
    </div>
  )
}
