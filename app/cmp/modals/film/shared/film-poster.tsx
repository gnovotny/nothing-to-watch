import { type PointerEventHandler, useState } from 'react'
import config from '../../../../config'
import { cn } from '@/utl/tw'
import type { Film } from '../../../../vf'

export const FilmPoster = ({
  film,
  onPointerOver,
  className = '',
}: {
  film: Film
  onPointerOver?: PointerEventHandler<HTMLImageElement>
  className?: string
}) => {
  const [hidden, setHidden] = useState(true)
  return (
    <img
      src={`${config.posterBaseUrl}${film.poster}`}
      crossOrigin='anonymous'
      alt={film.title}
      className={cn('', className, {
        '!w-0 !h-0 !aspect-none !basis-0': hidden,
      })}
      onLoad={() => {
        setHidden(false)
      }}
      onError={() => {
        setHidden(true)
      }}
      onPointerOver={onPointerOver}
    />
  )
}
