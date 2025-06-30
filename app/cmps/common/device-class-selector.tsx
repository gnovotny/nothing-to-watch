import { Check } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { useMediaQuery } from '../../hks/use-media-query'
import { useShallowState } from '../../store'
import { down } from '../../utls/mq'
import { cn } from '../../utls/tw'
import { Badge } from '../ui/badge'
import { Button, type ButtonProps } from '../ui/button'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { type DEVICE_CLASS, DEVICE_CLASSES } from '@/vf/consts.ts'
import { isDefined } from '../../utls/misc'

export function DeviceClassSelector({
  className = '',
  onApply,
  submitLabel = 'Continue',
  submitProps,
}: {
  className?: string
  onApply?: (deviceClass: DEVICE_CLASS) => void
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
      DEVICE_CLASSES.find((p) => p.id === estimatedDeviceClass)
        ? estimatedDeviceClass
        : undefined),
  )

  return (
    <div className={className}>
      <RadioGroup
        defaultValue={String(selectedDeviceClass)}
        onValueChange={(p: string) =>
          setSelectedDeviceClass(Number.parseInt(p) as DEVICE_CLASS)
        }
        className='hidden flex-col gap-4 py-4 md:flex md:flex-row'
      >
        {DEVICE_CLASSES.map((deviceClass) => (
          <label
            htmlFor={String(deviceClass.id)}
            key={deviceClass.id}
            className={`relative flex flex-1 cursor-pointer flex-col rounded-xl border-2 p-4 transition-all ${
              selectedDeviceClass === deviceClass.id
                ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800/50'
                : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
            }`}
          >
            {deviceClass.id === estimatedDeviceClass && (
              <Badge className='-translate-y-1/2 -translate-x-1/2 !text-background absolute top-0 left-1/2 text-xxs hover:bg-primary'>
                Estimated
              </Badge>
            )}
            <RadioGroupItem
              id={String(deviceClass.id)}
              value={String(deviceClass.id)}
              className='sr-only'
            />
            <div className='flex items-start justify-between'>
              <div>
                <h3 className='font-semibold text-lg text-zinc-900 dark:text-white'>
                  {deviceClass.name}
                </h3>
              </div>
            </div>
            {selectedDeviceClass === deviceClass.id && (
              <div className='-top-2 -right-2 absolute'>
                <span className='flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 dark:bg-white'>
                  <Check className='h-3 w-3 text-white dark:text-zinc-900' />
                </span>
              </div>
            )}
          </label>
        ))}
      </RadioGroup>

      <div className='flex flex-col gap-2'>
        <Button
          onClick={() => {
            const deviceClass = isDefined(selectedDeviceClass)
              ? selectedDeviceClass
              : estimatedDeviceClass
            if (deviceClass) {
              setStoreDeviceClass(deviceClass)
              onApply?.(deviceClass)
            }
          }}
          size='lg'
          disabled={!isSmallScreen && !selectedDeviceClass}
          {...submitProps}
          className={cn(
            'w-full cursor-pointer text-lg',
            submitProps?.className,
          )}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
