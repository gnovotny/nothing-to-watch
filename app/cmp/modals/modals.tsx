import {} from './film'
import { store } from '../../store'
import { useShallow } from 'zustand/react/shallow'
import { FadeTransition } from '../common/transition'
import { lazy } from 'react'

const ModalItems = lazy(() => import('./items'))

function Modals() {
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
      {voroforceInitiated && <ModalItems />}
    </FadeTransition>
  )
}

export default Modals
