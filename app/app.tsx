import FilmPreview from './components/film/film-preview'
import FilmViewDrawer from './components/film/film-view'
import { Intro } from './components/intro/intro'
import { Navbar } from './components/layout/navbar'
import { ThemeProvider } from './components/layout/theme'
import { Settings } from './components/settings/settings'
import { SmallScreenWarning } from './components/small-screen-warning/small-screen-warning'

function App() {
  return (
    <ThemeProvider defaultTheme='dark' storageKey='theme'>
      <div className='pointer-events-none relative z-10 h-full w-full'>
        <Navbar />
        <div className='relative h-screen w-full'>
          <Settings />
          <FilmPreview />
          <FilmViewDrawer />
        </div>
      </div>
      <SmallScreenWarning />
      <Intro />
    </ThemeProvider>
  )
}

export default App
