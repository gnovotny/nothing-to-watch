'use client'
import type React from 'react'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../../utls/tw'

type AnimateHeightChangeProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode
  className?: string
  innerClassName?: string
  enabled?: boolean
  style?: CSSProperties
  duration?: number
  delay?: number
}

export const AnimateHeightChange: React.FC<AnimateHeightChangeProps> = ({
  children,
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

  useEffect(() => {
    if (!enabled) return
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        const observedHeight = entries[0].contentRect.height
        setHeight(observedHeight)
      })

      resizeObserver.observe(containerRef.current)

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [enabled])

  return (
    <div
      {...props}
      className={cn(
        'relative overflow-hidden transition-[height] duration-300 ease-out will-change-[height]',
        className,
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        ...style,
        height,
      }}
    >
      <div ref={containerRef} className={innerClassName}>
        {children}
      </div>
    </div>
  )
}
