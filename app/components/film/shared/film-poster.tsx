import config from '../../../config'
import { cn } from '../../../lib/utils/tw'
import type { Film } from '../../../lib/voroforce'

export const FilmPoster = ({
  film,
  className = '',
}: { film: Film; className?: string }) => {
  return (
    <img
      src={`${config.posterBaseUrl}${film.poster}`}
      alt=''
      className={cn('', className)}
    />
  )
}
