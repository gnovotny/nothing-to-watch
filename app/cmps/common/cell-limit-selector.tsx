import { useMemo } from 'react'
import {
  type CELL_LIMIT,
  CELL_LIMIT_ITEMS,
  type DEVICE_CLASS,
} from '@/vf/consts.ts'
import { isDefined } from '../../utls/misc'
import { Selector, type SelectorItems } from './selector'
import { cn } from '../../utls/tw'
import { DeviceClassWarningMessage } from './device-class-warning-message'
import { Grid3x3Icon } from 'lucide-react'

export function CellLimitSelector({
  className = '',
  value,
  onValueChange,
  deviceClass,
}: {
  className?: string
  value?: CELL_LIMIT
  onValueChange: (value: CELL_LIMIT) => void
  deviceClass?: DEVICE_CLASS
}) {
  const cellLimitItems: SelectorItems = useMemo(() => {
    return CELL_LIMIT_ITEMS.map((cellLimit) => {
      return {
        label: cellLimit.label,
        value: String(cellLimit.value),
        hasWarning:
          isDefined(cellLimit.recommendedDeviceClass) &&
          isDefined(deviceClass) &&
          cellLimit.recommendedDeviceClass > deviceClass,
      }
    })
  }, [deviceClass])

  return (
    <div className='flex flex-col gap-4 md:flex-row'>
      <div className='flex items-center gap-2 font-semibold text-xl text-zinc-900 dark:text-white'>
        <Grid3x3Icon className='h-5 w-5 text-zinc-900 dark:text-white' />
        Films
      </div>
      <Selector
        className={cn('', className)}
        itemClassName='py-1 text-center text-sm leading-none rounded-lg'
        defaultValue={String(value)}
        onValueChange={(value) => {
          onValueChange(Number.parseInt(value) as CELL_LIMIT)
        }}
        items={cellLimitItems}
        warningMessage={<DeviceClassWarningMessage deviceClass={deviceClass} />}
        warningClassName='-translate-y-2/3'
        warningIconClassName='[&>svg]:size-3 p-1 group-hover:scale-160'
      />
    </div>
  )
}
