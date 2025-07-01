import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app'
import { animateHtmlTitleSuffix } from './utils/anim'
import { safeInitVoroforce } from './vf'
import './styles.css'

window.addEventListener('load', async () => {
  await safeInitVoroforce()

  // biome-ignore lint/style/noNonNullAssertion: exists
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )

  animateHtmlTitleSuffix()
})
