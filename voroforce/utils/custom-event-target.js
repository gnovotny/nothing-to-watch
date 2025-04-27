export class CustomEventTarget extends EventTarget {
  listen(type, callback, options) {
    this.addEventListener(type, callback, options)
  }

  listenOnce(type, callback, options) {
    this.addEventListener(type, callback, {
      ...options,
      once: true,
    })
  }

  unlisten(type, callback, options) {
    this.removeEventListener(type, callback, options)
  }
}
