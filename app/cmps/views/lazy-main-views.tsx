import { VOROFORCE_MODE } from '@/vf'
import { lazy } from 'react'
import { useShallowState } from '../../store'
import { FadeTransition } from '../common/fade-transition'

const MainViews = lazy(() => import('./main-views'))

function LazyMainViews() {
  const loadViews = useShallowState(
    ({ mode, preset }) => mode !== VOROFORCE_MODE.intro && Boolean(preset),
  )

  return (
    <FadeTransition
      visible={loadViews}
      className='relative h-dvh w-full overflow-hidden'
    >
      {loadViews && <MainViews />}
    </FadeTransition>
  )
}

export default LazyMainViews
