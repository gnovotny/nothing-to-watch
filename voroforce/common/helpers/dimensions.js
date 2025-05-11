import { CustomEventTarget } from '../../utils/custom-event-target'

class DimensionsEvent extends Event {
  constructor(data = {}) {
    super('resize')
    this.data = data
  }
}

function debounce(func, wait) {
  let timeout
  return function (...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

export class Dimensions extends CustomEventTarget {
  #state
  handleResize

  constructor(container, state) {
    super()

    if (container) {
      this.container = container
      this.update()

      const handleResize = () => {
        this.update()
        this.dispatchDimensionsEvent()
      }

      this.handleResize = debounce(handleResize, 100)

      window.addEventListener('resize', this.handleResize)
    } else if (state) {
      this.#state = state
    }
  }

  dispatchDimensionsEvent() {
    this.dispatchEvent(new DimensionsEvent(this.#state))
  }

  onResize(cb) {
    this.addEventListener('resize', cb)
  }

  update() {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    const diagonal = Math.sqrt(width ** 2 + height ** 2)
    const aspect = width / height
    const pixelRatio = Math.min(Math.max(window.devicePixelRatio, 1), 2)

    this.#state = {
      width,
      height,
      diagonal,
      aspect,
      pixelRatio,
    }
  }

  setState(s) {
    Object.assign(this.#state, typeof s === 'function' ? s(this.#state) : s)
    this.dispatchDimensionsEvent()
  }

  set(s) {
    this.setState(s)
  }

  getState(key) {
    if (key) {
      return this.#state[key]
    }
    return this.#state
  }

  get(key) {
    return this.getState(key)
  }

  get width() {
    return this.getState('width')
  }

  get height() {
    return this.getState('height')
  }

  get diagonal() {
    return this.getState('diagonal')
  }

  get aspect() {
    return this.getState('aspect')
  }

  get pixelRatio() {
    return this.getState('pixelRatio')
  }

  dispose() {
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize)
    }
  }
}
