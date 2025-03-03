export const setStyles = (element, styles) => {
  if (styles !== undefined) {
    Object.keys(styles).forEach((key) => {
      element.style.setProperty(key, styles[key])
    })
  }
}
