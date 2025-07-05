import { About } from './about'
import { FilmPreview, FilmViewDrawer } from './film'
import { LowFpsAlert } from './low-fps-alert'
import { Settings } from './settings'
import { Favorites } from './favorites'

const PrimaryViews = () => (
  <>
    <Settings />
    <About />
    <Favorites />
    <FilmPreview />
    <FilmViewDrawer />
    <LowFpsAlert />
  </>
)

export default PrimaryViews
