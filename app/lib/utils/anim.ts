/**
 * Animates the document title by adding a suffix character by character
 */
export const animateHtmlTitleSuffix = (suffix = '...', delay = 300) => {
  const originalTitle = document.title
  let counter = 0
  return setInterval(() => {
    if (counter > suffix.length) counter = 0
    document.title = originalTitle + suffix.substring(0, counter)
    counter++
  }, delay)
}
