import { type PropsWithChildren, useEffect } from 'react'

import { useTransitionState } from '../../hooks/use-transition-state'
import { cn } from '../../utils/tw'

export const FadeTransition = ({
  children,
  visible,
  className,
  notEnteredClassName = '',
  transitionOptions,
}: PropsWithChildren<{
  visible: boolean
  className?: string
  notEnteredClassName?: string
  transitionOptions?: Partial<Parameters<typeof useTransitionState>[0]>
}>) => {
  const [{ status, isMounted }, toggle] = useTransitionState({
    timeout: 1000,
    ...transitionOptions,
  })

  useEffect(() => {
    toggle(visible)
  }, [visible, toggle])

  return (
    isMounted && (
      <div
        className={cn('transition-opacity duration-700', className, {
          'opacity-0': status !== 'entered',
          [notEnteredClassName]: status !== 'entered',
        })}
      >
        {children}
      </div>
    )
  )
}
