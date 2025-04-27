import type { PropsWithChildren } from 'react'

export const Container = ({ children }: PropsWithChildren) => (
  <div className='pointer-events-none relative z-10 h-full w-full'>
    {children}
  </div>
)
