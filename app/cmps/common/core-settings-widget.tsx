import { type ReactNode, useState } from 'react'

import { useMediaQuery } from '../../hks/use-media-query'
import { useShallowState } from '../../store'
import { down } from '../../utls/mq'
import { cn } from '../../utls/tw'
import { VOROFORCE_PRESET } from '../../vf'
import { Button, type ButtonProps } from '../ui/button'
import { CELL_LIMIT, CELL_LIMIT_ITEMS, PRESET_ITEMS } from '@/vf/consts.ts'
import { isDefined } from '../../utls/misc'
import { PresetSelector } from './preset-selector'
import { CellLimitSelector } from './cell-limit-selector'
import { AnimateDimensionsChange } from './animate-dimensions-change'
import { FadeTransition } from './fade-transition'

export function CoreSettingsWidget({
  className = '',
  onSubmit,
  submitLabel = 'Apply',
  submitProps,
  submitVisibility = 'dirty',
}: {
  className?: string
  onSubmit?: () => void
  submitLabel?: string | ReactNode
  submitProps?: ButtonProps
  submitVisibility?: 'dirty' | 'always'
}) {
  const {
    storeDeviceClass,
    estimatedDeviceClass,
    setStorePreset,
    storePreset,
    setStoreCellLimit,
    storeCellLimit,
  } = useShallowState((state) => ({
    setStorePreset: state.setPreset,
    storePreset: state.preset,
    setStoreCellLimit: state.setCellLimit,
    storeCellLimit: state.cellLimit,
    storeDeviceClass: state.deviceClass,
    estimatedDeviceClass: state.estimatedDeviceClass,
  }))

  const deviceClass = isDefined(storeDeviceClass)
    ? storeDeviceClass
    : estimatedDeviceClass

  const isSmallScreen = useMediaQuery(down('md'))

  const [preset, setPreset] = useState<VOROFORCE_PRESET | undefined>(
    storePreset ??
      (isSmallScreen
        ? VOROFORCE_PRESET.minimal
        : isDefined(deviceClass)
          ? PRESET_ITEMS.find((p) =>
              isDefined(p.recommendedDeviceClass)
                ? p.recommendedDeviceClass < deviceClass
                : true,
            )?.id
          : undefined),
  )

  const [cellLimit, setCellLimit] = useState<CELL_LIMIT | undefined>(
    storeCellLimit ??
      (isSmallScreen
        ? CELL_LIMIT.xxs
        : isDefined(deviceClass)
          ? CELL_LIMIT_ITEMS.findLast((p) =>
              isDefined(p.recommendedDeviceClass)
                ? p.recommendedDeviceClass < deviceClass
                : true,
            )?.value
          : undefined),
  )

  const [isDirty, setIsDirty] = useState(false)

  return (
    <AnimateDimensionsChange
      axis='height'
      className='overflow-visible'
      innerClassName={cn('flex flex-col gap-4', className)}
    >
      <PresetSelector
        value={preset}
        onValueChange={(value: VOROFORCE_PRESET) => {
          setPreset(value)
          setIsDirty(value !== storePreset || cellLimit !== storeCellLimit)
        }}
        deviceClass={deviceClass}
      />
      <CellLimitSelector
        value={cellLimit}
        onValueChange={(value: CELL_LIMIT) => {
          setCellLimit(value)
          setIsDirty(preset !== storePreset || value !== storeCellLimit)
        }}
        deviceClass={deviceClass}
      />
      <FadeTransition
        transitionOptions={{
          initialEntered: submitVisibility === 'always',
          timeout: 0,
        }}
        visible={submitVisibility === 'always' || isDirty}
      >
        <Button
          onClick={() => {
            setStorePreset(
              isDefined(preset) ? preset : VOROFORCE_PRESET.minimal,
            )
            setStoreCellLimit(isDefined(cellLimit) ? cellLimit : CELL_LIMIT.sm)
            onSubmit?.()
          }}
          size='lg'
          disabled={!isSmallScreen && !isDefined(preset)}
          {...submitProps}
          className={cn(
            'w-full cursor-pointer text-lg',
            submitProps?.className,
          )}
        >
          {submitLabel}
        </Button>
      </FadeTransition>
    </AnimateDimensionsChange>
  )
}
