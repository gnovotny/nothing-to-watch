import { useMemo } from 'react'
import { type DEVICE_CLASS, DEVICE_CLASS_ITEMS } from '../../../vf/consts.ts'
import { Selector, type SelectorItems } from '../selector'
import { cn } from '../../../utils/tw'
import { TabletSmartphone } from 'lucide-react'

export function DeviceClassSelector({
  className = '',
  value,
  onValueChange,
}: {
  className?: string
  value?: DEVICE_CLASS
  onValueChange: (value: DEVICE_CLASS) => void
}) {
  const deviceClassItems: SelectorItems = useMemo(() => {
    return DEVICE_CLASS_ITEMS.map((deviceClass) => {
      return {
        label: deviceClass.name,
        value: String(deviceClass.id),
      }
    })
  }, [])

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center gap-2 font-semibold text-xl text-zinc-900 dark:text-white'>
        <TabletSmartphone className='h-5 w-5 text-zinc-900 dark:text-white' />
        Your device
      </div>
      <Selector
        className={cn('', className)}
        defaultValue={String(value)}
        onValueChange={(value) => {
          onValueChange(Number.parseInt(value) as DEVICE_CLASS)
        }}
        items={deviceClassItems}
      />
    </div>
  )
}
