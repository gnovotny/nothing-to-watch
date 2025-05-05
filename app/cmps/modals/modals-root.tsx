import {useShallowState} from '../../store'
import {FadeTransition} from '../common/transition'
import {lazy} from 'react'
import {VOROFORCE_MODE} from "@/vf";

const Modals = lazy(() => import('./modals'))

function ModalsRoot() {
  const canLoad = useShallowState(
    ({ mode, preset }) => mode !== VOROFORCE_MODE.intro && Boolean(preset),
  )

  return (
    <FadeTransition
      visible={canLoad}
      className='relative h-dvh w-full overflow-hidden'
      // transitionOptions={{
      //   timeout: 2000,
      // }}
    >
      {canLoad && <Modals />}
    </FadeTransition>
  )
}

export default ModalsRoot
