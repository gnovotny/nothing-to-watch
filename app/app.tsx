import { lazy } from 'react'

import { Intro } from '@/cmp/intro'
import { Navbar, ThemeProvider } from '@/cmp/layout'
const Modals = lazy(() => import('@/cmp/modals/modals'))

const App = () => (
  <ThemeProvider>
    {/*<Container>*/}
    <Navbar />
    <Modals />
    {/*</Container>*/}
    <Intro />
  </ThemeProvider>
)

export default App
