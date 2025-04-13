import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app'
import { animateHtmlTitleSuffix } from './utils/anim'
import { initVoroforce } from './voroforce'
import './index.css'

window.addEventListener('load', async () => {
  try {
    // biome-ignore lint/style/noNonNullAssertion: exists
    await initVoroforce(document.getElementById('voroforce')!)
  } catch (e) {
    alert((e as Error).message)
  }

  // biome-ignore lint/style/noNonNullAssertion: exists
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )

  animateHtmlTitleSuffix()
})
