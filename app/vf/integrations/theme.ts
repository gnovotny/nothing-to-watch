import type { THEME } from '../../consts'
import { store } from '../../store'
import { updateUniformsByTheme } from '../utils'

const handleThemeChange = (theme: THEME): void => {
  const {
    configUniforms: {
      main: mainUniforms,
      post: postUniforms,
      animating: animatingUniforms,
    },
  } = store.getState()

  updateUniformsByTheme(mainUniforms, theme, animatingUniforms)
  updateUniformsByTheme(postUniforms, theme, animatingUniforms)
}

export const handleTheme = () => {
  const { theme: initialTheme } = store.getState()
  handleThemeChange(initialTheme)
  store.subscribe((state) => state.theme, handleThemeChange)
}
