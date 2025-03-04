import { Intro } from './components/intro/intro'
import { Navbar } from './components/layout/navbar'
import { ThemeProvider } from './components/layout/theme'
import { Settings } from './components/settings/settings'
import { SmallScreenWarning } from './components/small-screen-warning/small-screen-warning'
import { About } from './components/about/about'

function App() {
  return (
    <ThemeProvider defaultTheme='dark' storageKey='theme'>
      <div className='pointer-events-none relative z-10 h-full w-full'>
        <Navbar />
        <div className='relative h-screen w-full'>
          <Settings />
          <About />
          {/*<FilmPreview />*/}
          {/*<FilmViewDrawer />*/}
        </div>
      </div>
      <SmallScreenWarning />
      <Intro />
    </ThemeProvider>
  )
}

export default App
