import type React from 'react'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../../utils/tw'

type AnimateDimensionsChangeProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode
  axis?: 'height' | 'width' | 'both'
  className?: string
  innerClassName?: string
  enabled?: boolean
  style?: CSSProperties
  duration?: number
  delay?: number
}

export const AnimateDimensionsChange: React.FC<
  AnimateDimensionsChangeProps
> = ({
  children,
  axis = 'both',
  className,
  innerClassName,
  enabled = true,
  style,
  duration = 300,
  delay = 0,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [height, setHeight] = useState<number | 'auto'>('auto')
  const [width, setWidth] = useState<number | 'auto'>('auto')

  useEffect(() => {
    if (!enabled || !containerRef.current) return
    const resizeObserver = new ResizeObserver((entries) => {
      if (axis === 'height' || axis === 'both') {
        setHeight(entries[0].contentRect.height)
      }
      if (axis === 'width' || axis === 'both') {
        setWidth(entries[0].contentRect.width)
      }
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [enabled, axis])

  return (
    <div
      {...props}
      className={cn(
        'overflow-hidden duration-300 ease-out',
        {
          'transition-[height,width] will-change-[height,width]':
            axis === 'both',
          'transition-[height] will-change-[height]': axis === 'height',
          'transition-[width] will-change-[width]': axis === 'width',
        },
        className,
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        ...style,
        ...(axis === 'height' || axis === 'both'
          ? {
              height,
            }
          : undefined),
        ...(axis === 'width' || axis === 'both'
          ? {
              width,
            }
          : undefined),
      }}
    >
      <div ref={containerRef} className={innerClassName}>
        {children}
      </div>
    </div>
  )
}
