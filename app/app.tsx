import { Intro } from './cmps/views/intro'
import { Navbar, ThemeProvider } from './cmps/layout'
import LazyMainViews from './cmps/views'

const App = () => (
  <ThemeProvider>
    <Navbar />
    <LazyMainViews />
    <Intro />
  </ThemeProvider>
)

export default App
