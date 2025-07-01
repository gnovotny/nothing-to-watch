import { Check, TriangleAlert } from 'lucide-react'
import { type PropsWithChildren, type ReactNode, useState } from 'react'
import { cn } from '../../utls/tw'
import { AnimateDimensionsChange } from './animate-dimensions-change'
import {
  Root as RadioGroupPrimitiveRoot,
  Item as RadioGroupPrimitiveItem,
} from '@radix-ui/react-radio-group'
import { Label } from '../ui/label'

export type SelectorItem = {
  value: string
  label: ReactNode | string
  hasWarning?: boolean
}

export type SelectorItems = SelectorItem[]

export function SelectorItemWarning({
  children,
  isSelected,
  className = '',
  iconClassName = '',
}: PropsWithChildren<{
  isSelected?: boolean
  className?: string
  iconClassName?: string
}>) {
  return (
    <AnimateDimensionsChange
      duration={700}
      delay={100}
      className={cn(
        '-translate-y-1/2 -translate-x-1/2 !text-background !transition-all pointer-events-none absolute top-0 left-1/2 z-10 rounded-2xl bg-amber-200 font-semibold text-xs leading-none will-change-[background-color] dark:bg-amber-800',
        {
          'ease-in-out will-change-[transform,translate,height,width,border-radius,background-color] contain-strict group-hover:translate-y-[calc(-100%-1rem)] group-hover:rounded-md':
            !!children,
          'bg-amber-700 group-hover:will-change-[transform,translate,height,width,border-radius,background-color] dark:group-hover:bg-amber-700':
            !isSelected,
          'bg-amber-500 dark:bg-amber-500': isSelected,
        },
        className,
      )}
      innerClassName={cn('flex size-fit flex-row')}
    >
      <div
        className={cn(
          'p-1.5',
          {
            'origin-top-left transition-transform duration-500 group-hover:scale-130 [&>svg]:size-4':
              !!children,
          },
          iconClassName,
        )}
      >
        <TriangleAlert />
      </div>
      {children && (
        <div className='relative h-full'>
          <div
            className={cn(
              'absolute top-0 left-0 h-full w-36 py-1.5 pr-1.5 pl-2 opacity-0 transition-opacity duration-1000 group-hover:static group-hover:opacity-100',
            )}
          >
            {children}
          </div>
        </div>
      )}
    </AnimateDimensionsChange>
  )
}

export function Selector({
  className = '',
  itemClassName = '',
  itemBgClassName = '',
  warningClassName = '',
  warningIconClassName = '',
  items,
  defaultValue,
  onValueChange,
  warningMessage,
}: {
  className?: string
  itemClassName?: string
  itemBgClassName?: string
  warningClassName?: string
  warningIconClassName?: string
  items: SelectorItems
  defaultValue?: string
  onValueChange?: (value: string) => void
  warningMessage?: ReactNode
}) {
  const [value, setValue] = useState<string | undefined>(defaultValue)

  return (
    <RadioGroupPrimitiveRoot
      defaultValue={value}
      onValueChange={(v: string) => {
        setValue(v)
        onValueChange?.(v)
      }}
      className={cn('flex flex-col gap-4 md:flex-row', className)}
    >
      {items.map((item) => {
        const hasWarning = item.hasWarning
        const itemValue = String(item.value)
        const isSelected = value === itemValue

        return (
          <div key={itemValue} className='group relative flex-1'>
            <Label
              htmlFor={itemValue}
              className={cn(
                'relative flex size-full cursor-pointer flex-col overflow-hidden rounded-xl border-2 p-4 transition-all',
                'font-semibold text-lg text-zinc-900 dark:text-white',
                {
                  'border-zinc-200 dark:border-zinc-800': !hasWarning,
                  'hover:border-zinc-400 dark:hover:border-zinc-700':
                    !hasWarning && !isSelected,
                  'border-amber-800 dark:border-amber-800 ': hasWarning,
                  'hover:border-amber-700 dark:hover:border-amber-700':
                    hasWarning && !isSelected,
                  'border-zinc-900 dark:border-white ':
                    isSelected && !hasWarning,
                  'border-amber-500 dark:border-amber-500 ':
                    isSelected && hasWarning,
                },
                itemClassName,
              )}
            >
              <div
                className={cn(
                  '-z-1 absolute inset-0 h-full w-full',
                  {
                    'bg-zinc-50/25 dark:bg-zinc-800/50':
                      isSelected && !hasWarning,
                    'bg-amber-800/50 dark:bg-amber-800/50':
                      isSelected && hasWarning,
                  },
                  itemBgClassName,
                )}
              />
              <RadioGroupPrimitiveItem
                id={itemValue}
                value={itemValue}
                className='sr-only'
              />
              {item.label}
            </Label>
            <div
              className={cn(
                '-top-2.5 -right-2.5 absolute z-10 transition-opacity duration-300',
                {
                  'opacity-0': !isSelected,
                },
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 dark:bg-white',
                  {
                    'bg-amber-500 dark:bg-amber-500': hasWarning,
                  },
                )}
              >
                <Check
                  className={cn(
                    'h-3.5 w-3.5 text-white dark:text-zinc-900',
                    {},
                  )}
                />
              </span>
            </div>
            {hasWarning && (
              <SelectorItemWarning
                isSelected={isSelected}
                className={warningClassName}
                iconClassName={warningIconClassName}
              >
                {warningMessage}
              </SelectorItemWarning>
            )}
          </div>
        )
      })}
    </RadioGroupPrimitiveRoot>
  )
}
