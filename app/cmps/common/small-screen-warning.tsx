import { TriangleAlertIcon } from 'lucide-react'
import { cn } from '../../utils/tw'

export const SmallScreenWarning = ({
  className = '',
}: { className?: string }) => (
  <div className={cn('flex flex-col gap-2 py-4 md:hidden', className)}>
    <div className='flex items-center gap-2 font-semibold text-xl text-zinc-900 dark:text-white'>
      <TriangleAlertIcon className='h-5 w-5 text-amber-500 ' />
      <div>Warning</div>
    </div>
    <p className='text-base text-zinc-600 leading-tight dark:text-zinc-300'>
      This page is best viewed on a larger device like a desktop or laptop.
    </p>
  </div>
)
