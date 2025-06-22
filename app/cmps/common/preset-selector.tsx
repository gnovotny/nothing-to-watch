'use client'

import { Check, TriangleAlert } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { useMediaQuery } from '../../hks/use-media-query'
import { useShallowState } from '../../store'
import { down } from '../../utls/mq'
import { cn } from '../../utls/tw'
import { VOROFORCE_PRESET } from '../../vf'
import { Badge } from '../ui/badge'
import { Button, type ButtonProps } from '../ui/button'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { DEVICE_CLASS } from '@/vf/consts.ts'
import { isDefined } from '../../utls/misc'

const PRESETS = [
  {
    id: VOROFORCE_PRESET.minimal,
    name: 'Minimal',
    features: ['10,000 films'],
  },
  {
    id: VOROFORCE_PRESET.contours,
    name: 'Contours',
    features: ['25,000 films', 'Special effects'],
    recommendedDeviceClass: DEVICE_CLASS.mid,
  },
  {
    id: VOROFORCE_PRESET.depth,
    name: 'Depth',
    features: ['50,000 films', 'Raymarching'],
    recommendedDeviceClass: DEVICE_CLASS.high,
  },
]

export function PresetSelector({
  className = '',
  onApply,
  submitLabel = 'Continue',
  submitProps,
}: {
  className?: string
  onApply?: (preset: VOROFORCE_PRESET) => void
  submitLabel?: string | ReactNode
  submitProps?: ButtonProps
}) {
  const {
    storeDeviceClass,
    estimatedDeviceClass,
    setStorePreset,
    storePreset,
  } = useShallowState((state) => ({
    setStorePreset: state.setPreset,
    storePreset: state.preset,
    storeDeviceClass: state.deviceClass,
    estimatedDeviceClass: state.estimatedDeviceClass,
  }))

  const deviceClass = isDefined(storeDeviceClass)
    ? storeDeviceClass
    : estimatedDeviceClass

  const isSmallScreen = useMediaQuery(down('md'))

  const [selectedPreset, setSelectedPreset] = useState<
    VOROFORCE_PRESET | undefined
  >(
    storePreset ??
      (isSmallScreen
        ? VOROFORCE_PRESET.minimal
        : isDefined(deviceClass)
          ? PRESETS.find((p) =>
              isDefined(p.recommendedDeviceClass)
                ? p.recommendedDeviceClass < deviceClass
                : false,
            )?.id
          : undefined),
  )

  console.log(deviceClass)

  return (
    <div className={className}>
      <RadioGroup
        defaultValue={selectedPreset}
        onValueChange={(p: VOROFORCE_PRESET) => setSelectedPreset(p)}
        className='hidden flex-col gap-4 py-4 md:flex md:flex-row'
      >
        {PRESETS.map((preset) => {
          const notRecommended =
            preset.recommendedDeviceClass &&
            isDefined(deviceClass) &&
            preset.recommendedDeviceClass > deviceClass

          const isSelected = selectedPreset === preset.id
          return (
            <label
              htmlFor={preset.id}
              key={preset.id}
              className={cn(
                'relative flex flex-1 cursor-pointer flex-col rounded-xl border-2 p-4 transition-all',
                {
                  'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700':
                    !notRecommended,
                  'hover:border-zinc-300 dark:hover:border-zinc-700':
                    !notRecommended && !isSelected,
                  'border-amber-200 dark:border-amber-800 ': notRecommended,
                  'hover:border-amber-300 dark:hover:border-amber-700':
                    notRecommended && !isSelected,
                  'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800/50':
                    isSelected,
                },
                {
                  'border-amber-500 bg-amber-50 dark:border-amber-500 dark:bg-amber-800/50':
                    isSelected && notRecommended,
                },
              )}
            >
              {notRecommended && (
                <Badge className='-translate-y-1/2 -translate-x-1/2 !text-background absolute top-0 left-1/2 whitespace-nowrap bg-amber-500 px-1 text-xxs leading-none hover:bg-amber-500'>
                  <TriangleAlert className='mr-1 size-2.5' />
                  Not recommended
                </Badge>
              )}
              <RadioGroupItem
                id={preset.id}
                value={preset.id}
                className='sr-only'
              />
              <div className='flex items-start justify-between'>
                <div>
                  <h3 className='font-semibold text-lg text-zinc-900 dark:text-white'>
                    {preset.name}
                  </h3>
                </div>
              </div>
              <ul className='mt-4 list-disc space-y-0 pl-3'>
                {preset.features.map((feature) => (
                  <li
                    key={feature}
                    className='whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-300'
                  >
                    {feature}
                  </li>
                ))}
              </ul>
              {isSelected && (
                <div className='-top-2 -right-2 absolute'>
                  <span className='flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 dark:bg-white'>
                    <Check className='h-3 w-3 text-white dark:text-zinc-900' />
                  </span>
                </div>
              )}
            </label>
          )
        })}
      </RadioGroup>

      <div className='flex flex-col gap-2'>
        <Button
          onClick={() => {
            const preset = isDefined(selectedPreset)
              ? selectedPreset
              : VOROFORCE_PRESET.minimal
            if (preset) {
              setStorePreset(preset)
              onApply?.(preset)
            }
          }}
          size='lg'
          disabled={!isSmallScreen && !isDefined(selectedPreset)}
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
