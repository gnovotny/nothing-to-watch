import { clamp, easedMinLerp, isTouchDevice, setStyles } from '../utils'

const TMP_TOUCH_DRAG_MODE = true

class PointerMoveEvent extends Event {
  constructor(pointer) {
    super('pointerMove')
    this.pointer = pointer
  }
}

class CellFocusedEvent extends Event {
  constructor(cell) {
    super('focused')
    this.cell = cell
  }
}

class CellSelectedEvent extends Event {
  constructor(cell) {
    super('selected')
    this.cell = cell
  }
}

export class Controls extends EventTarget {
  prevX = 0
  prevY = 0
  prevTime = 0
  focusDisabled = false
  isWarm = false

  constructor(store, display) {
    super()
    this.initGlobals(store, display)
    this.initProperties()
    this.initEventListeners()

    this.update = this.handleFirstUpdate
  }

  initGlobals(store, display) {
    this.store = store
    this.store.set('controls', this)
    this.globalConfig = this.store.get('config')
    this.config = this.globalConfig.controls
    this.display = display
  }

  initProperties() {
    this.container = this.store.get('container')
    this.dimensions = this.store.get('dimensions')
    this.pointer = this.store.get('sharedPointer')
    this.cells = this.store.get('cells')
    this.maxDeltaTime = this.config.maxDeltaTime ?? 10 // Maximum time difference in milliseconds

    const d = this.dimensions.get('diagonal')
    this.maxPointerSpeed = this.config.maxPointerSpeed * d
    this.defaultPointerRadiusScale = this.config.pointerRadius
    this.unfocusedPointerRadiusScale = this.defaultPointerRadiusScale * 0.15
    this.activePointerRadiusScale = this.unfocusedPointerRadiusScale
    this.pointerRadius = this.activePointerRadiusScale * d
  }

  handleFirstUpdate() {
    this.update = this.handleUpdate
    if (
      !this.config.autoFocusCenter?.enabled ||
      (this.config.autoFocusCenter.enabled === 'touch' && !isTouchDevice)
    )
      return
    const width = this.dimensions.get('width')
    const height = this.dimensions.get('height')
    this.targetPointer = {
      x:
        width / 2 +
        (this.config.autoFocusCenter.random
          ? (0.5 - Math.random()) * 0.05 * width
          : 0),
      y:
        height / 2 +
        (this.config.autoFocusCenter.random
          ? (0.5 - Math.random()) * 0.05 * height
          : 0),
    }
    this.handleUpdate()
  }

  handleUpdate() {
    if (!this.targetPointer) {
      this.pointer.speedScale = 0
      return
    }
    const newPointerData = { x: this.targetPointer.x, y: this.targetPointer.y }

    const currentTime = performance.now()
    let deltaTime = currentTime - this.prevTime

    // Cap the deltaTime to prevent jumps after pauses
    if (deltaTime > this.maxDeltaTime) {
      deltaTime = this.maxDeltaTime
    }

    // Skip if this is the first move or if no time has passed
    if (this.prevTime === 0 || deltaTime === 0) {
      this.prevX = this.targetPointer.x
      this.prevY = this.targetPointer.y
      this.prevTime = currentTime
      newPointerData.speedScale = 0
      return
    }

    // if (!this.prevX || !this.prevY) {
    //   this.prevX = this.targetPointer.x
    //   this.prevY = this.targetPointer.y
    // }

    // console.log('this.prevX', this.prevX)

    // Calculate the raw movement
    const deltaX = this.targetPointer.x - this.prevX
    const deltaY = this.targetPointer.y - this.prevY

    // Calculate distance
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    console.log('distance', distance)
    console.log('this.pointerRadius', this.pointerRadius)
    // Abort if outside of reaction radius
    if (distance > this.pointerRadius) {
      this.activePointerRadiusScale = this.unfocusedPointerRadiusScale
      this.pointerRadius =
        this.activePointerRadiusScale * this.dimensions.get('diagonal')

      this.pointer.speedScale = 0
      this.targetPointer = undefined

      return
    }
    if (distance !== 0) {
      this.activePointerRadiusScale = this.defaultPointerRadiusScale
      this.pointerRadius =
        this.activePointerRadiusScale * this.dimensions.get('diagonal')
    }

    const speedMod = distance ? 1 - distance / this.pointerRadius : 1
    const dynamicMaxPointerSpeed = speedMod * this.maxPointerSpeed

    // Calculate current speed (pixels per second)
    let speed = distance / (deltaTime / 1000)

    // Apply speed limit if needed
    if (speed > dynamicMaxPointerSpeed) {
      // Scale factor to limit speed
      const scale = dynamicMaxPointerSpeed / speed
      speed *= scale

      // Apply scaled movement
      const limitedDeltaX = deltaX * scale
      const limitedDeltaY = deltaY * scale

      // Calculate limited new position
      const newX = this.prevX + limitedDeltaX
      const newY = this.prevY + limitedDeltaY

      // Update position with the limited coordinates
      newPointerData.x = newX
      newPointerData.y = newY
    }

    newPointerData.speedScale = easedMinLerp(
      this.pointer.speedScale,
      Math.min(speed, this.maxPointerSpeed) / this.maxPointerSpeed,
      0.1,
    )

    // Update previous values for next event
    this.prevX = newPointerData.x
    this.prevY = newPointerData.y

    this.prevTime = currentTime

    Object.assign(this.pointer, newPointerData)
    this.handlePointerMove()

    this.display.getCellIndicesByPointer(this.pointer).then((indices) => {
      const index = indices?.[0]
      if (index === undefined) {
        this.onPointerOut()
        return
      }

      Object.assign(this.pointer, {
        indices,
      })

      if (this.cells.realFocusedIndex !== index) {
        this.cells.realFocusedIndex = index
        if (!this.focusDisabled) {
          this.cells.focusedIndex = index
          this.dispatchEvent(new CellFocusedEvent(this.cells.focused))
        }
      }

      if (!this.isWarm) {
        this.isWarm = true
        this.onPointerOut()
      }
    })
  }

  onPointerDown(e) {
    this.pointer.down = true
  }

  onPointerUp(e) {
    Object.assign(this.pointer, {
      down: false,
      dragging: false,
    })
    if (this.cells.dragging) {
      this.handlePointerDragEnd()
    } else {
      this.handlePointerClick()
    }
  }

  onPointerMove(e) {
    // if (this.paused) return
    this.targetPointer = { x: e.x, y: e.y }

    if (this.pointer.down) {
      if (!this.pointer.dragging) {
        this.pointer.dragging = true
        this.handlePointerDragStart()
      }
      this.handlePointerDrag()
    }
  }

  onTouchStart(e) {
    switch (e.touches.length) {
      case 1: {
        if (TMP_TOUCH_DRAG_MODE) {
          const x = e.touches[0].pageX
          const y = e.touches[0].pageY
          this.touchStart = { x, y }
        }
        break
      }
    }
  }

  onTouchMove(e) {
    // e.preventDefault()
    // e.stopPropagation()

    switch (e.touches.length) {
      case 1: {
        let x = e.touches[0].pageX
        let y = e.touches[0].pageY
        if (TMP_TOUCH_DRAG_MODE) {
          const pointerX = this.pointer.x ?? this.dimensions.width / 2
          const pointerY = this.pointer.y ?? this.dimensions.height / 2
          const distX = this.touchStart.x - x
          const distY = this.touchStart.y - y

          this.touchStart = { x, y }
          x = clamp(0, this.dimensions.width, pointerX - distX)
          y = clamp(0, this.dimensions.height, pointerY - distY)
        }
        this.onPointerMove({
          x,
          y,
        })
        break
      }
    }
  }

  onPointerOut(event) {
    this.handlePointerOut()
  }

  handlePointerClick() {
    this.cells.selectedIndex =
      this.cells.selectedIndex !== this.cells.focusedIndex
        ? this.cells.focusedIndex
        : undefined

    this.dispatchEvent(new CellSelectedEvent(this.cells.selected))
  }

  deselect() {
    this.cells.selectedIndex = undefined
    this.dispatchEvent(new CellSelectedEvent(undefined))
  }

  handlePointerMove() {
    this.dispatchEvent(new PointerMoveEvent(this.pointer))
  }

  handlePointerOut() {
    if (this.cells.selected) return
    this.targetPointer = undefined
    this.activePointerRadiusScale = this.unfocusedPointerRadiusScale
    this.pointerRadius =
      this.activePointerRadiusScale * this.dimensions.get('diagonal')
    Object.assign(this.pointer, {
      x: undefined,
      y: undefined,
      index: undefined,
    })
    // this.cells.focusedIndex = undefined
    // this.dispatchEvent(new CellFocusedEvent(undefined))
  }

  disableFocus() {
    // this.targetPointer = undefined
    // Object.assign(this.pointer, {
    //   x: undefined,
    //   y: undefined,
    //   index: undefined,
    // })
    this.focusDisabled = true
  }

  enableFocus() {
    this.focusDisabled = false
  }

  handlePointerDragStart() {
    setStyles(this.container, {
      cursor: 'grabbing',
    })
  }

  handlePointerDrag() {}

  handlePointerDragEnd() {
    setStyles(this.container, {
      cursor: 'auto',
    })
  }

  initEventListeners() {
    window.addEventListener('blur', this.onPointerOut.bind(this))

    this.container.addEventListener(
      'pointerdown',
      this.onPointerDown.bind(this),
    )
    this.container.addEventListener('pointerup', this.onPointerUp.bind(this))

    if (isTouchDevice) {
      this.container.addEventListener(
        'touchstart',
        this.onTouchStart.bind(this),
      )
      this.container.addEventListener('touchmove', this.onTouchMove.bind(this))
    } else {
      this.container.addEventListener(
        'pointermove',
        this.onPointerMove.bind(this),
      )
      this.container.addEventListener(
        'pointerout',
        this.onPointerOut.bind(this),
      )
    }
  }

  removeEventListeners() {
    window.removeEventListener('blur', this.onPointerOut)

    if (isTouchDevice) {
      this.container.removeEventListener('touchstart', this.onTouchStart)
      this.container.removeEventListener('touchmove', this.onTouchMove)
    } else {
      this.container.removeEventListener('pointermove', this.onPointerMove)
      this.container.removeEventListener('pointerout', this.onPointerOut)
    }

    this.container.removeEventListener('pointerdown', this.onPointerDown)
    this.container.removeEventListener('pointerup', this.onPointerUp)
  }

  resize(dimensions) {
    this.maxPointerSpeed = this.config.maxPointerSpeed * dimensions.diagonal
    this.pointerRadius = this.activePointerRadiusScale * dimensions.diagonal
  }

  dispose() {
    this.removeEventListeners()
  }
}
