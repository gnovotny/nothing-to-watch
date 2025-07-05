import { Intro } from './cmps/views/intro'
import { Navbar, ThemeProvider } from './cmps/layout'
import LazyPrimaryViews from './cmps/views'

const App = () => (
  <ThemeProvider>
    <Navbar />
    <LazyPrimaryViews />
    <Intro />
  </ThemeProvider>
)

export default App
