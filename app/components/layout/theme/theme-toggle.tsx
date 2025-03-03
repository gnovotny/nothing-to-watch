import { Moon, Sun } from 'lucide-react'
import { cn } from '../../../lib/utils/tw'
import { Button } from '../../ui/button'
import { useTheme } from './theme-provider'

export function ThemeToggle({ className = '' }) {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant='ghost'
      type='button'
      size='icon'
      className={cn('px-2', className)}
      aria-label='Toggle theme'
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className='size-[1.2rem] text-neutral-800 dark:hidden dark:text-neutral-200' />
      <Moon className='hidden size-[1.2rem] text-neutral-800 dark:block dark:text-neutral-200' />
    </Button>
  )
}
