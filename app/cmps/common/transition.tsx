import { type PropsWithChildren, useEffect } from 'react'

import { useTransitionState } from '../../hks/use-transition-state'
import { cn } from '../../utls/tw'

export const FadeTransition = ({
  children,
  visible,
  className,
  transitionOptions,
}: PropsWithChildren<{
  visible: boolean
  className?: string
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
        })}
      >
        {children}
      </div>
    )
  )
}
