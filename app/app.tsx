import { About } from './components/about/about'
import { FilmViewDrawer } from './components/film/view/film-view-drawer'
import WanderingFilmPreview from './components/film/wandering-film-preview'
import { Intro } from './components/intro/intro'
import { Navbar } from './components/layout/navbar'
import { ThemeProvider } from './components/layout/theme'
import { Settings } from './components/settings/settings'
import { THEME } from './voroforce'

function App() {
  return (
    <ThemeProvider defaultTheme={THEME.dark} storageKey='theme'>
      <div className='pointer-events-none relative z-10 h-full w-full'>
        <Navbar />
        <div className='relative h-screen w-full overflow-hidden'>
          <Settings />
          <About />
          {/*<FilmPreview />*/}
          <WanderingFilmPreview />
          <FilmViewDrawer />
        </div>
      </div>
      {/*<SmallScreenWarning />*/}
      <Intro />
    </ThemeProvider>
  )
}

export default App
