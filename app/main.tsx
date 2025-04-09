// const g =
//   (typeof globalThis !== 'undefined' && globalThis) ||
//   (typeof self !== 'undefined' && self) ||
//   (typeof global !== 'undefined' && global) ||
//   {}
//
// const originalFetch = fetch
// // biome-ignore lint/suspicious/noExplicitAny: <explanation>
// ;(g as any).fetch = (input: RequestInfo | URL, init?: RequestInit) => {
//   console.log('input', input)
//   return originalFetch(input, init)
// }

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
