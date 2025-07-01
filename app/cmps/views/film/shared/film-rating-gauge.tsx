import type React from 'react'
import { cn } from '../../../../utils/tw'

type RatingGaugeProps = React.ComponentProps<'svg'> & {
  value: number
  className?: string
}

function clamp(input: number, a: number, b: number): number {
  return Math.max(Math.min(input, Math.max(a, b)), Math.min(a, b))
}

// match values with lucide icons for compatibility
const size = 24
const strokeWidth = 2

// fix to percentage values
const total = 100

export const FilmRatingGauge = ({
  value,
  className,
  ...restSvgProps
}: RatingGaugeProps) => {
  const normalizedValue = clamp(value ?? 0, 0, total)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (normalizedValue / total) * circumference
  const halfSize = size / 2

  const circleProps = {
    cx: halfSize,
    cy: halfSize,
    r: radius,
    fill: 'none',
    strokeWidth,
  }

  return (
    <div className={cn('relative size-14 shrink-0 text-lg', className)}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className='size-full'
        aria-valuenow={normalizedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        {...restSvgProps}
      >
        <circle {...circleProps} className='stroke-current/25' />
        <circle
          {...circleProps}
          stroke='currentColor'
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap='round'
          transform={`rotate(-90 ${halfSize} ${halfSize})`}
          className='stroke-current'
        />
      </svg>
      <div className='-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 leading-none'>
        {Math.round(value)}
        <span className='text-[0.5rem]'>%</span>
      </div>
    </div>
  )
}
