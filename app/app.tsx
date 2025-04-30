import { Intro } from './cmps/intro'
import { Navbar, ThemeProvider } from './cmps/layout'
import Modals from './cmps/modals'

const App = () => (
  <ThemeProvider>
    <Navbar />
    <Modals />
    <Intro />
  </ThemeProvider>
)

export default App
