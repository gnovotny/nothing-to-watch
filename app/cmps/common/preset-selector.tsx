import { useMemo } from 'react'
import type { VOROFORCE_PRESET } from '../../vf'
import { type DEVICE_CLASS, PRESET_ITEMS } from '@/vf/consts.ts'
import { isDefined } from '../../utls/misc'
import { Selector, type SelectorItems } from './selector'
import { cn } from '../../utls/tw'
import { DeviceClassWarningMessage } from './device-class-warning-message'
import { Settings2 } from 'lucide-react'

export function PresetSelector({
  className = '',
  value,
  onValueChange,
  deviceClass,
}: {
  className?: string
  value?: VOROFORCE_PRESET
  onValueChange: (value: VOROFORCE_PRESET) => void
  deviceClass?: DEVICE_CLASS
}) {
  const presetItems: SelectorItems = useMemo(() => {
    return PRESET_ITEMS.map((preset) => {
      return {
        label: (
          <>
            <video
              className='absolute inset-0 h-full w-full rounded-xl object-cover object-center'
              playsInline
              autoPlay
              muted
              controls={false}
              loop
            >
              <source src={preset.videoSrc} type='video/webm' />
            </video>
            <div className='relative z-2'>{preset.name}</div>
          </>
        ),
        value: preset.id,
        hasWarning:
          isDefined(preset.recommendedDeviceClass) &&
          isDefined(deviceClass) &&
          preset.recommendedDeviceClass > deviceClass,
      }
    })
  }, [deviceClass])

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-end gap-4'>
        <div className='flex items-center gap-2 font-semibold text-xl text-zinc-900 leading-none dark:text-white'>
          <Settings2 className='h-5 w-5 text-zinc-900 dark:text-white' />
          Preset
        </div>
        {/*<p className='text-sm text-zinc-600 leading-none dark:text-zinc-300'>*/}
        {/*  You can change this later*/}
        {/*</p>*/}
      </div>
      <Selector
        className={cn('', className)}
        itemClassName='aspect-video'
        itemBgClassName='z-1'
        defaultValue={value}
        onValueChange={(value) => {
          onValueChange(value as VOROFORCE_PRESET)
        }}
        items={presetItems}
        warningMessage={<DeviceClassWarningMessage deviceClass={deviceClass} />}
      />
    </div>
  )
}
