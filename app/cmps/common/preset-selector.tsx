'use client'

import { Check } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { useMediaQuery } from '../../hks/use-media-query'
import { useShallowState } from '../../store'
import { down } from '../../utls/mq'
import { cn } from '../../utls/tw'
import { VOROFORCE_PRESET } from '../../vf'
import { Badge } from '../ui/badge'
import { Button, type ButtonProps } from '../ui/button'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import {DEVICE_CLASS} from "@/vf/consts.ts";

const DEVICE_CLASSES = [
    {
        id: DEVICE_CLASS.low,
        name: '🥔 Potato',
    },
    {
        id: DEVICE_CLASS.mid,
        name: '😐 Mid-range',
    },
    {
        id: DEVICE_CLASS.high,
        name: '💪 High-end',
    },
]

const PRESETS = [
  {
    id: VOROFORCE_PRESET.low,
    name: 'Minimal',
    features: ['10,000 films'],
  },
  {
    id: VOROFORCE_PRESET.mid,
    name: 'Contours',
    features: ['25,000 films', 'Special effects'],
    recommendedDeviceClass: DEVICE_CLASS.mid
  },
  {
    id: VOROFORCE_PRESET.high,
    name: 'Depth',
    features: ['50,000 films', 'Raymarching'],
    recommendedDeviceClass: DEVICE_CLASS.high
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
  const { recommendedPreset, setStorePreset, storePreset } = useShallowState(
    (state) => ({
      setStorePreset: state.setPreset,
      recommendedPreset: state.recommendedPreset,
      storePreset: state.preset,
    }),
  )

  const isSmallScreen = useMediaQuery(down('md'))

  const [selectedPreset, setSelectedPreset] = useState<
    VOROFORCE_PRESET | undefined
  >(
    storePreset ??
      (isSmallScreen || PRESETS.find((p) => p.id === recommendedPreset)
        ? recommendedPreset
        : undefined),
  )

  return (
    <div className={className}>
      <RadioGroup
        defaultValue={selectedPreset}
        onValueChange={(p: VOROFORCE_PRESET) => setSelectedPreset(p)}
        className='hidden flex-col gap-4 py-4 md:flex md:flex-row'
      >
        {PRESETS.map((preset) => (
          <label
            htmlFor={preset.id}
            key={preset.id}
            className={`relative flex flex-1 cursor-pointer flex-col rounded-xl border-2 p-4 transition-all ${
              selectedPreset === preset.id
                ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800/50'
                : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
            }`}
          >
            {preset.id === recommendedPreset && (
              <Badge className='-translate-y-1/2 -translate-x-1/2 !text-background absolute top-0 left-1/2 text-xxs hover:bg-primary'>
                Recommended
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
            {selectedPreset === preset.id && (
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
            const preset = selectedPreset || recommendedPreset
            if (preset) {
              setStorePreset(preset)
              onApply?.(preset)
            }
          }}
          size='lg'
          disabled={!isSmallScreen && !selectedPreset}
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
