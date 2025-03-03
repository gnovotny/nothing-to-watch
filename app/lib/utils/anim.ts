/**
 * Animates the document title by adding and removing a suffix character by character
 */
export const animateHtmlTitleSuffix = (suffix = '...', delay = 300) => {
  const originalTitle = document.title
  let counter = 0
  let forwards = true

  return setInterval(() => {
    // Toggle direction when reaching boundaries
    if (counter === suffix.length) forwards = false
    if (counter === 0) forwards = true

    // Update counter based on direction
    counter += forwards ? 1 : -1

    // Calculate current suffix portion
    let currentSuffix = ''
    if (counter > 0) {
      currentSuffix = forwards
        ? suffix.substring(0, counter)
        : suffix.substring(counter)
    }

    // Update document title
    document.title = originalTitle + currentSuffix
  }, delay)
}
