import { Settings } from './settings'
import { About } from './about'
import { FilmPreview, FilmViewDrawer } from './film'

function Modals() {
  return (
    <div className='relative h-dvh w-full overflow-hidden'>
      <Settings />
      <About />
      <FilmPreview />
      <FilmViewDrawer />
      {/*<SmallScreenWarning />*/}
    </div>
  )
}

export default Modals
