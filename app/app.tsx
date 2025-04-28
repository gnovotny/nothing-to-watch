import { lazy } from 'react'

import { Intro } from '@/cmp/intro'
import { Navbar, ThemeProvider } from '@/cmp/layout'
import { store } from './store'
import { useShallow } from 'zustand/react/shallow'
const Modals = lazy(() => import('@/cmp/modals/modals'))

const App = () => {
  const { voroforce } = store(
    useShallow((state) => ({
      voroforce: state.voroforce,
    })),
  )
  return (
    <ThemeProvider>
      {/*<Container>*/}
      <Navbar />
      {voroforce && <Modals />}

      {/*</Container>*/}
      <Intro />
    </ThemeProvider>
  )
}

export default App
