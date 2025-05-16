const browserPrefixes = ['moz', 'ms', 'o', 'webkit']
let isVisible = true // internal flag, defaults to true

// get the correct attribute name
function getHiddenPropertyName(prefix) {
  return prefix ? `${prefix}Hidden` : 'hidden'
}

// get the correct event name
function getVisibilityEvent(prefix) {
  return `${prefix ? prefix : ''}visibilitychange`
}

// get current browser vendor prefix
function getBrowserPrefix() {
  for (let i = 0; i < browserPrefixes.length; i++) {
    if (getHiddenPropertyName(browserPrefixes[i]) in document) {
      // return vendor prefix
      return browserPrefixes[i]
    }
  }

  // no vendor prefix needed
  return null
}

// bind and handle events
const browserPrefix = getBrowserPrefix()
const hiddenPropertyName = getHiddenPropertyName(browserPrefix)
const visibilityEventName = getVisibilityEvent(browserPrefix)

function onVisible(handleOnVisible) {
  // prevent double execution
  if (isVisible) {
    return
  }

  // change flag value
  isVisible = true
  handleOnVisible()
}

function onHidden(handleOnHidden) {
  // prevent double execution
  if (!isVisible) {
    return
  }

  // change flag value
  isVisible = false
  handleOnHidden()
}

function handleVisibilityChange(forcedFlag, handleOnVisible, handleOnHidden) {
  // forcedFlag is a boolean when this event handler is triggered by a
  // focus or blur event otherwise it's an Event object
  if (typeof forcedFlag === 'boolean') {
    if (forcedFlag) {
      return onVisible(handleOnVisible)
    }

    return onHidden(handleOnHidden)
  }

  if (document[hiddenPropertyName]) {
    return onHidden(handleOnHidden)
  }

  return onVisible(handleOnVisible)
}

export const initVisibilityEventHandlers = (
  handleOnVisible = () => {},
  handleOnHidden = () => {},
) => {
  document.addEventListener(
    visibilityEventName,
    (flag) => {
      handleVisibilityChange(flag, handleOnVisible, handleOnHidden)
    },
    false,
  )

  // extra event listeners for better behaviour
  document.addEventListener(
    'focus',
    () => {
      handleVisibilityChange(true, handleOnVisible, handleOnHidden)
    },
    false,
  )

  document.addEventListener(
    'blur',
    () => {
      handleVisibilityChange(false, handleOnVisible, handleOnHidden)
    },
    false,
  )

  window.addEventListener(
    'focus',
    () => {
      handleVisibilityChange(true, handleOnVisible, handleOnHidden)
    },
    false,
  )

  window.addEventListener(
    'blur',
    () => {
      handleVisibilityChange(false, handleOnVisible, handleOnHidden)
    },
    false,
  )
}
