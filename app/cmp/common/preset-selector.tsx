'use client'

import { Button } from '../ui/button'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Check, Settings } from 'lucide-react'
import { cn } from '../../utl/tw'
import { store } from '../../store'
import { useShallow } from 'zustand/react/shallow'
import { Badge } from '../ui/badge'
import { useState } from 'react'
import { safeInitVoroforce, VOROFORCE_PRESET } from '../../vf'

const presets = [
  {
    id: VOROFORCE_PRESET.low,
    name: '🥔 Potato',
    features: ['10,000 cells'],
  },
  {
    id: VOROFORCE_PRESET.mid,
    name: '😐 Mid',
    features: ['25,000 cells', 'Special effects'],
  },
  {
    id: VOROFORCE_PRESET.high,
    name: '💪 Beefy',
    cellCount: '50,000',
    features: ['50,000 cells', 'Raymarching'],
  },
]

export function PresetSelector({ className = '' }) {
  const { recommendedPreset, storePreset, setStorePreset } = store(
    useShallow((state) => ({
      selectedPreset: state.preset,
      setStorePreset: state.setPreset,
      recommendedPreset: state.recommendedPreset,
      storePreset: state.preset,
    })),
  )

  const [selectedPreset, setPreset] = useState<VOROFORCE_PRESET | undefined>(
    recommendedPreset,
  )

  return (
    <div
      className={cn(
        'opacity-100 transition-opacity duration-700',
        {
          'opacity-0': storePreset,
        },
        className,
      )}
    >
      <div>
        <div className='flex items-center gap-2 font-semibold text-xl text-zinc-900 dark:text-white'>
          <Settings className='h-5 w-5 text-zinc-900 dark:text-white' />
          What best describes the device you're using?
        </div>
        <p className='text-sm text-zinc-600 dark:text-zinc-300'>
          You can change this later in the settings.
        </p>
      </div>

      <RadioGroup
        defaultValue={selectedPreset}
        onValueChange={(p: VOROFORCE_PRESET) => setPreset(p)}
        className='flex flex-col gap-4 py-4 lg:flex-row'
      >
        {presets.map((preset) => (
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
              {preset.features.map((feature, index) => (
                <li
                  key={index}
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
            if (selectedPreset) {
              setStorePreset(selectedPreset)
              void safeInitVoroforce()
            }
          }}
          className='w-full cursor-pointer bg-zinc-900 text-lg text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100'
          size='lg'
          disabled={!selectedPreset}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
