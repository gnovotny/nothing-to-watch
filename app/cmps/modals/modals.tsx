import { About } from './about'
import { FilmPreview, FilmViewDrawer } from './film'
import { LowFpsAlert } from './low-fps-alert'
import { Settings } from './settings'

const Modals = () => (
  <>
    <Settings />
    <About />
    <FilmPreview />
    <FilmViewDrawer />
    <LowFpsAlert />
  </>
)

export default Modals
