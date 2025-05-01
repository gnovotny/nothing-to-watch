import React, { type PropsWithChildren, type ReactNode, useState } from 'react'
import { type DialogProps, Drawer as DrawerPrimitive } from 'vaul'

import { useMediaQuery } from '../../hks/use-media-query'
import { orientation } from '../../utls/mq'
import { cn } from '../../utls/tw'
import {
  Drawer,
  DrawerDescription,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
} from '../ui/drawer'

const AppDrawerHandle = ({
  className = '',
  direction,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  direction?: DialogProps['direction']
}) => (
  <div
    className={cn(
      'not-landscape:-translate-x-1/2 landscape:-translate-y-1/2 landscape:-translate-x-1/2 absolute not-landscape:top-0 not-landscape:left-1/2 not-landscape:h-2.5 not-landscape:w-[100px] not-landscape:translate-y-1/2 cursor-grab rounded-full bg-background/80 landscape:top-1/2 landscape:left-0 landscape:h-[100px] landscape:w-2.5',
      {
        'not-landscape:-translate-x-1/2 landscape:right-0 landscape:left-auto landscape:translate-x-1/2':
          direction === 'left',
        'not-landscape:top-auto not-landscape:bottom-0': direction === 'top',
      },
      className,
    )}
    {...props}
  />
)

const AppDrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & {
    direction?: DialogProps['direction']
  }
>(({ className, children, direction, ...props }, ref) => (
  <DrawerPrimitive.Content
    ref={ref}
    className={cn(
      'not-landscape:-inset-x-px pointer-events-none fixed not-landscape:bottom-0 z-30 not-landscape:h-auto focus-visible:outline-none not-landscape:md:inset-x-0 md:px-3 md:py-3 lg:px-6 lg:py-6 landscape:top-0 landscape:right-0 landscape:h-full landscape:max-h-[36rem] landscape:max-w-[40%] landscape:lg:h-auto landscape:lg:max-h-full landscape:lg:w-[40%]',
      {
        'landscape:right-auto landscape:left-0': direction === 'left',
        'not-landscape:top-0 not-landscape:bottom-auto': direction === 'top',
      },
      className,
    )}
    {...props}
  >
    {children}
  </DrawerPrimitive.Content>
))

const AppDrawerContentInner = ({
  className = '',
  children,
}: PropsWithChildren<{ className?: string }>) => (
  <div
    className={cn(
      'pointer-events-auto relative not-landscape:w-full cursor-grab overflow-hidden not-landscape:rounded-b-3xl bg-background/70 transition-colors duration-500 md:rounded-xl not-landscape:md:rounded-b-xl landscape:h-full landscape:rounded-xl landscape:lg:h-full landscape:lg:max-h-[calc(100vh-var(--spacing)*6*2)]',
      className,
    )}
  >
    {children}
  </div>
)

const AppDrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'pointer-events-none absolute inset-x-0 top-0 z-1 mb-auto flex w-full flex-col gap-2 p-0',
      className,
    )}
    {...props}
  />
)

const AppDrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'pointer-events-none absolute inset-x-0 bottom-0 z-1 mt-auto flex w-full flex-col gap-2 p-0',
      className,
    )}
    {...props}
  />
)

export const AppDrawer = ({
  rootProps,
  contentProps,
  innerContentProps,
  headerProps,
  footerProps,
  handleProps,
  children,
  header,
  footer,
  overlay,
}: {
  rootProps?: React.ComponentProps<typeof DrawerPrimitive.Root>
  contentProps?: React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
  innerContentProps?: React.HTMLAttributes<HTMLDivElement>
  headerProps?: React.HTMLAttributes<HTMLDivElement>
  footerProps?: React.HTMLAttributes<HTMLDivElement>
  handleProps?: React.HTMLAttributes<HTMLDivElement>
  children: ReactNode | undefined
  header?: ReactNode | undefined
  footer?: ReactNode | undefined
  overlay?: boolean
}) => {
  const landscape = useMediaQuery(orientation('landscape'))

  const [isDragging, setIsDragging] = useState(false)

  const direction = rootProps?.direction ?? (landscape ? 'right' : 'bottom')

  return (
    <Drawer
      direction={direction}
      disablePreventScroll
      shouldScaleBackground={false}
      onDrag={() => setIsDragging(true)}
      onRelease={() => setIsDragging(false)}
      {...rootProps}
    >
      <DrawerPortal>
        {overlay && <DrawerOverlay />}
        <AppDrawerContent
          direction={direction}
          {...contentProps}
          className={cn(contentProps?.className, {})}
        >
          <DrawerHeader className='sr-only'>
            <DrawerTitle />
            <DrawerDescription />
          </DrawerHeader>
          <AppDrawerContentInner
            {...innerContentProps}
            className={cn(innerContentProps?.className, {
              'cursor-grabbing': isDragging,
            })}
          >
            {header && (
              <AppDrawerHeader {...headerProps}>{header}</AppDrawerHeader>
            )}
            {children}
            {footer && (
              <AppDrawerFooter {...footerProps}>{footer}</AppDrawerFooter>
            )}
          </AppDrawerContentInner>
          <AppDrawerHandle
            direction={direction}
            {...handleProps}
            className={cn(handleProps?.className, {
              'cursor-grabbing': isDragging,
            })}
          />
        </AppDrawerContent>
      </DrawerPortal>
    </Drawer>
  )
}
