import { Settings } from './settings'
import { About } from './about'
import { FilmPreview, FilmViewDrawer } from './film'
import { LowFpsWarning } from './low-fps-warning'

const Modals = () => (
  <>
    <Settings />
    <About />
    <FilmPreview />
    <FilmViewDrawer />
    <LowFpsWarning />
  </>
)

export default Modals
