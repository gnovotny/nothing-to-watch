'use client'
import type React from 'react'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../../utl/tw'

interface AnimateHeightChangeProps {
  children: React.ReactNode
  className?: string
  innerClassName?: string
  enabled?: boolean
  style?: CSSProperties
}

export const AnimateHeightChange: React.FC<AnimateHeightChangeProps> = ({
  children,
  className,
  innerClassName,
  enabled = true,
  style,
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
      className={cn(
        'overflow-hidden transition-[height] duration-300 ease-out will-change-[height]',
        className,
      )}
      style={{
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
