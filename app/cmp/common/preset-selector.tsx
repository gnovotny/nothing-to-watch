'use client'

import { Button } from '../ui/button'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Check, Settings, TriangleAlert } from 'lucide-react'
import { store } from '../../store'
import { useShallow } from 'zustand/react/shallow'
import { Badge } from '../ui/badge'
import { useState } from 'react'
import { safeInitVoroforce, VOROFORCE_PRESET } from '../../vf'
import { useMediaQuery } from '../../hk/use-media-query'
import { down } from '../../utl/mq'

const presets = [
  {
    id: VOROFORCE_PRESET.low,
    name: '🥔 Potato',
    features: ['10,000 films'],
  },
  {
    id: VOROFORCE_PRESET.mid,
    name: '😐 Mid',
    features: ['25,000 films', 'Special effects'],
  },
  {
    id: VOROFORCE_PRESET.high,
    name: '💪 Beefy',
    features: ['50,000 films', 'Raymarching'],
  },
]

export function PresetSelector({ className = '' }) {
  const { recommendedPreset, setStorePreset } = store(
    useShallow((state) => ({
      setStorePreset: state.setPreset,
      recommendedPreset: state.recommendedPreset,
      storePreset: state.preset,
    })),
  )

  const isSmallScreen = useMediaQuery(down('md'))

  const [selectedPreset, setSelectedPreset] = useState<
    VOROFORCE_PRESET | undefined
  >(
    isSmallScreen || presets.find((p) => p.id === recommendedPreset)
      ? recommendedPreset
      : undefined,
  )

  return (
    <div className={className}>
      <div className='hidden md:block'>
        <div>
          <div className='flex items-center gap-2 font-semibold text-xl text-zinc-900 dark:text-white'>
            <Settings className='h-5 w-5 text-zinc-900 dark:text-white' />
            What best describes the device you're using?
          </div>
          <p className='text-sm text-zinc-600 dark:text-zinc-300'>
            You can change this later
          </p>
        </div>

        <RadioGroup
          defaultValue={selectedPreset}
          onValueChange={(p: VOROFORCE_PRESET) => setSelectedPreset(p)}
          className='flex flex-col gap-4 py-4 md:flex-row'
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
      </div>

      <div className='flex flex-col gap-2 py-4 md:hidden'>
        <div className='flex items-center gap-2 font-semibold text-xl text-zinc-900 dark:text-white'>
          <TriangleAlert className='h-5 w-5 text-amber-500 ' />
          <div>Warning</div>
        </div>
        <p className='text-base text-zinc-600 dark:text-zinc-300'>
          This website is best viewed on a larger device like a desktop or
          laptop.
        </p>
      </div>

      <div className='flex flex-col gap-2'>
        <Button
          onClick={() => {
            const preset = selectedPreset || recommendedPreset
            if (preset) {
              setStorePreset(preset)
              void safeInitVoroforce()
            }
          }}
          className='w-full cursor-pointer text-lg'
          size='lg'
          disabled={!isSmallScreen && !selectedPreset}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
