import config from '../../../config'
import { cn } from '../../../lib/utils/tw'
import type { Film } from '../../../lib/voroforce'
import { type PointerEventHandler, useState } from 'react'

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
  // return null
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
