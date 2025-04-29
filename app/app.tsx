import { Intro } from '@/cmp/intro'
import { Navbar, ThemeProvider } from '@/cmp/layout'
import Modals from './cmp/modals'

const App = () => (
  <ThemeProvider>
    <Navbar />
    <Modals />
    <Intro />
  </ThemeProvider>
)

export default App
