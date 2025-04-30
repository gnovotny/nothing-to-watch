import { useShallowState } from '../../store'
import { FadeTransition } from '../common/transition'
import { lazy } from 'react'

const Modals = lazy(() => import('./modals'))

function ModalsRoot() {
  const isIntro = useShallowState(({ mode }) => mode === 'intro')

  return (
    <FadeTransition
      visible={!isIntro}
      className='relative h-dvh w-full overflow-hidden'
      transitionOptions={{
        timeout: 2000,
      }}
    >
      {!isIntro && <Modals />}
    </FadeTransition>
  )
}

export default ModalsRoot
