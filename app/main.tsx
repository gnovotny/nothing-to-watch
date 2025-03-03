import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app'
import { animateHtmlTitleSuffix } from './lib/utils/anim'
import { createVoroforce } from './lib/voroforce'
import './index.css'

// biome-ignore lint/style/noNonNullAssertion: exists
createVoroforce(document.getElementById('voroforce')!)

// biome-ignore lint/style/noNonNullAssertion: exists
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

animateHtmlTitleSuffix()
