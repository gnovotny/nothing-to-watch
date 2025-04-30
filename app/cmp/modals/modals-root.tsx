import {} from './film'
import { store } from '../../store'
import { useShallow } from 'zustand/react/shallow'
import { FadeTransition } from '../common/transition'
import { lazy } from 'react'

const Modals = lazy(() => import('./modals'))

function ModalsRoot() {
  const { voroforceInitiated } = store(
    useShallow((state) => ({
      voroforceInitiated: Boolean(state.voroforce),
    })),
  )

  return (
    <FadeTransition
      visible={voroforceInitiated}
      className='relative h-dvh w-full overflow-hidden'
      transitionOptions={{
        timeout: 2000,
      }}
    >
      {voroforceInitiated && <Modals />}
    </FadeTransition>
  )
}

export default ModalsRoot
