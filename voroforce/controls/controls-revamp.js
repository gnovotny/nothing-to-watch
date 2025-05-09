import { isTouchDevice } from '../utils'
import { CustomEventTarget } from '../utils/custom-event-target'

// biome-ignore lint/suspicious/noShadowRestrictedNames: intentional
const Infinity = Number.POSITIVE_INFINITY

const { abs, atan2, pow, sqrt, random, min, PI } = Math

class PointerMoveEvent extends Event {
  constructor(pointer) {
    super('pointerMove')
    this.pointer = pointer
  }
}

class CellFocusedEvent extends Event {
  constructor(cell, cells) {
    super('focused')
    this.cell = cell
    this.cells = cells
  }
}

class CellSelectedEvent extends Event {
  constructor(cell, cells) {
    super('selected')
    this.cell = cell
    this.cells = cells
  }
}

export default class Controls extends CustomEventTarget {
  prevX = 0
  prevY = 0
  pointerFrozen = true
  pointerFrozenUntilRefocus = true

  constructor(store, display, options = {}) {
    super()
    this.initGlobals(store, display)
    this.initProperties()
    this.initEventListeners()

    // Configuration options with defaults
    this.options = {
      maxSpeed: options.maxSpeed !== undefined ? options.maxSpeed : Infinity, // Maximum speed threshold in px/s
      maxAcceleration:
        options.maxAcceleration !== undefined
          ? options.maxAcceleration
          : Infinity, // Maximum acceleration threshold in px/s²
      capValues: options.capValues || false, // Whether to cap values at the threshold
      ...options,
    }

    // Store previous positions and timestamps
    this.positions = []
    this.maxPositions = 10 // Number of positions to store for calculations

    // Current values
    this.position = { x: 0, y: 0 }
    this.lastPosition = null // Last adjusted position
    this.speed = { x: 0, y: 0, total: 0 }
    this.lastSpeed = { x: 0, y: 0, total: 0 } // Last adjusted speed
    this.acceleration = { x: 0, y: 0, total: 0 }
    this.direction = 0

    // Flags for threshold detection
    this.isOverSpeedThreshold = false
    this.isOverAccelerationThreshold = false

    // Last timestamp for controlling position updates
    this.lastTimestamp = null

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
    this.activePointerRadiusScale = this.config.pointerRadius
    this.pointerRadius = this.activePointerRadiusScale * d
  }

  handleFirstUpdate() {
    if (
      this.cells.focused ||
      !this.config.autoFocusCenter?.enabled ||
      (this.config.autoFocusCenter.enabled === 'touch' && !isTouchDevice)
    ) {
      this.update = this.handleUpdate
      return
    }

    const width = this.dimensions.get('width')
    const height = this.dimensions.get('height')
    Object.assign(this.pointer, {
      x:
        width / 2 +
        (this.config.autoFocusCenter.random
          ? (0.5 - random()) * 0.05 * width
          : 0),
      y:
        height / 2 +
        (this.config.autoFocusCenter.random
          ? (0.5 - random()) * 0.05 * height
          : 0),
    })
    this.handleUpdate()
  }

  getCellIndices(position, cb) {
    this.display.getPositionCellIndices(position).then((indices) => {
      const primaryIndex = indices?.[0]
      if (primaryIndex === undefined) {
        this.onPointerOut()
        return false
      }
      cb(primaryIndex, indices)
    })
  }

  handleUpdate(position = this.position) {
    if (this.pointerFrozenUntilRefocus) {
      this.getCellIndices(this.pointer, (primaryIndex, indices) => {
        Object.assign(this.pointer, {
          indices,
        })

        if (this.cells.focusedIndex !== primaryIndex) {
          this.cells.focusedIndex = primaryIndex
          this.dispatchEvent(
            new CellFocusedEvent(this.cells.focused, this.cells),
          )
        }
      })
    }

    if (!position) return

    if (!this.pointerFrozen) {
      this.pointer.speedScale =
        Math.min(this.speed.total, this.maxPointerSpeed) / this.maxPointerSpeed
      // this.pointer.speedScale = easedMinLerp(
      //     this.pointer.speedScale,
      //     Math.min(speed, this.maxPointerSpeed) / this.maxPointerSpeed,
      //     0.1,
      // )
      Object.assign(this.pointer, position)
      this.handlePointerMove()
    }

    this.getCellIndices(position, (primaryIndex, indices) => {
      if (this.pointerFrozen) {
        if (this.pointerFrozenUntilBlurAndRefocus) {
          if (this.cells.focusedIndex !== primaryIndex) {
            // this.freezePointerUntilRefocus()

            this.pointer.speedScale = 0
            this.pointerFrozenUntilBlurAndRefocus = false

            Object.assign(this.pointer, this.frozenPointer)
            setTimeout(() => this.freezePointerUntilRefocus(), 250)
          } else {
            Object.assign(this.pointer, {
              indices,
            })
            Object.assign(this.pointer, position)
          }
        } else if (this.pointerFrozenUntilRefocus) {
          if (this.cells.focusedIndex === primaryIndex) {
            this.unfreezePointer()
          }
        }
      } else {
        if (this.cells.focusedIndex !== primaryIndex) {
          this.cells.focusedIndex = primaryIndex
          this.dispatchEvent(
            new CellFocusedEvent(this.cells.focused, this.cells),
          )
        }
        Object.assign(this.pointer, {
          indices,
        })
      }
    })
  }

  freezePointer() {
    this.pointerFrozen = true

    if (!this.frozenPointer) {
      this.frozenPointer = {
        indices: this.pointer.indices,
        x: this.pointer.x,
        y: this.pointer.y,
      }
    }
  }

  freezePointerUntilRefocus() {
    this.freezePointer()
    this.pointer.speedScale = 0
    this.pointerFrozenUntilRefocus = true
    this.pointerFrozenUntilBlurAndRefocus = false
  }

  freezePointerUntilBlurAndRefocus() {
    this.freezePointer()
    this.pointer.speedScale = 0.05
    this.pointerFrozenUntilRefocus = false
    this.pointerFrozenUntilBlurAndRefocus = true
  }

  unfreezePointer() {
    this.pointerFrozenUntilRefocus = false
    this.pointerFrozenUntilBlurAndRefocus = false
    this.pointerFrozen = false
    this.frozenPointer = null
  }

  onPointerDown(e) {
    this.pointer.down = true
  }

  onPointerUp(e) {
    Object.assign(this.pointer, {
      down: false,
    })
    this.handlePointerClick()
  }

  onPointerMove(e) {
    const timestamp = performance.now()
    const rawPosition = {
      x: e.x,
      y: e.y,
      timestamp: timestamp,
    }

    // Process the position with capping if needed
    const position = this.processPosition(rawPosition)

    // Update current position
    this.position = { x: position.x, y: position.y }

    // Add current position to our array
    this.positions.push(position)

    // Keep array at max size
    if (this.positions.length > this.maxPositions) {
      this.positions.shift()
    }

    // Calculate speed and acceleration if we have enough data points
    if (this.positions.length >= 2) {
      this.calculateSpeed()
      this.calculateDirection()
    }

    if (this.positions.length >= 3) {
      this.calculateAcceleration()
    }

    // Save last processed values for next calculation
    this.lastPosition = { ...this.position }
    this.lastTimestamp = timestamp
    this.lastSpeed = { ...this.speed }
  }

  processPosition(rawPosition) {
    // If not capping or this is the first position, just return raw position
    if (!this.options.capValues || !this.lastPosition || !this.lastTimestamp) {
      return rawPosition
    }

    // Calculate time difference in seconds
    const timeDiff = (rawPosition.timestamp - this.lastTimestamp) / 1000
    if (timeDiff <= 0) return rawPosition // Safety check

    // Calculate desired position based on raw mouse coordinates
    const desiredDeltaX = rawPosition.x - this.lastPosition.x
    const desiredDeltaY = rawPosition.y - this.lastPosition.y

    // Calculate the desired speed
    const desiredSpeedX = desiredDeltaX / timeDiff
    const desiredSpeedY = desiredDeltaY / timeDiff
    const desiredSpeedTotal = sqrt(
      desiredSpeedX * desiredSpeedX + desiredSpeedY * desiredSpeedY,
    )

    // If speed is within limits, no capping needed
    if (desiredSpeedTotal <= this.options.maxSpeed) {
      return rawPosition
    }

    // Cap the speed and calculate new position delta
    const speedFactor = this.options.maxSpeed / desiredSpeedTotal
    const cappedDeltaX = desiredDeltaX * speedFactor
    const cappedDeltaY = desiredDeltaY * speedFactor

    // Calculate the new position based on capped speed
    const cappedPosition = {
      x: this.lastPosition.x + cappedDeltaX,
      y: this.lastPosition.y + cappedDeltaY,
      timestamp: rawPosition.timestamp,
    }

    // Check acceleration cap if we have previous speed data
    if (this.options.maxAcceleration < Infinity && this.lastSpeed) {
      // Calculate desired acceleration
      const desiredAccelX = (desiredSpeedX - this.lastSpeed.x) / timeDiff
      const desiredAccelY = (desiredSpeedY - this.lastSpeed.y) / timeDiff
      const desiredAccelTotal = sqrt(
        desiredAccelX * desiredAccelX + desiredAccelY * desiredAccelY,
      )

      // If acceleration is over limit, cap it
      if (desiredAccelTotal > this.options.maxAcceleration) {
        const accelFactor = this.options.maxAcceleration / desiredAccelTotal

        // Calculate new speed based on capped acceleration
        const cappedSpeedX =
          this.lastSpeed.x + (desiredSpeedX - this.lastSpeed.x) * accelFactor
        const cappedSpeedY =
          this.lastSpeed.y + (desiredSpeedY - this.lastSpeed.y) * accelFactor

        // Calculate new position based on capped acceleration
        cappedPosition.x = this.lastPosition.x + cappedSpeedX * timeDiff
        cappedPosition.y = this.lastPosition.y + cappedSpeedY * timeDiff
      }
    }

    return cappedPosition
  }

  calculateSpeed() {
    // Use the two most recent positions
    const current = this.positions[this.positions.length - 1]
    const previous = this.positions[this.positions.length - 2]

    // Time difference in seconds
    const timeDiff = (current.timestamp - previous.timestamp) / 1000

    if (timeDiff > 0) {
      // Calculate speed components (pixels per second)
      this.speed.x = (current.x - previous.x) / timeDiff
      this.speed.y = (current.y - previous.y) / timeDiff

      // Calculate total speed (magnitude of velocity vector)
      this.speed.total = sqrt(pow(this.speed.x, 2) + pow(this.speed.y, 2))

      // Apply maximum speed threshold if specified
      if (this.options.maxSpeed < Infinity) {
        // Check if we're over the threshold
        this.isOverSpeedThreshold = this.speed.total > this.options.maxSpeed

        // Optionally cap the speed at the maximum value
        if (this.options.capValues && this.isOverSpeedThreshold) {
          const factor = this.options.maxSpeed / this.speed.total
          this.speed.x *= factor
          this.speed.y *= factor
          this.speed.total = this.options.maxSpeed
        }
      }
    }
  }

  calculateDirection() {
    // Calculate direction in degrees (0 = right, 90 = down, 180 = left, 270 = up)
    if (abs(this.speed.x) > 0.1 || abs(this.speed.y) > 0.1) {
      this.direction = atan2(this.speed.y, this.speed.x) * (180 / PI)
      // Convert to 0-360 range
      if (this.direction < 0) {
        this.direction += 360
      }
    }
  }

  calculateAcceleration() {
    // We need at least 3 positions to calculate acceleration
    const current = this.positions[this.positions.length - 1]
    const middle = this.positions[this.positions.length - 2]
    const oldest = this.positions[this.positions.length - 3]

    // Time differences in seconds
    const timeDiff1 = (middle.timestamp - oldest.timestamp) / 1000
    const timeDiff2 = (current.timestamp - middle.timestamp) / 1000

    if (timeDiff1 > 0 && timeDiff2 > 0) {
      // Calculate speed at two points in time
      const speed1 = {
        x: (middle.x - oldest.x) / timeDiff1,
        y: (middle.y - oldest.y) / timeDiff1,
      }

      const speed2 = {
        x: (current.x - middle.x) / timeDiff2,
        y: (current.y - middle.y) / timeDiff2,
      }

      // Calculate acceleration (change in speed over time)
      const timeDiffTotal = timeDiff1 + timeDiff2

      if (timeDiffTotal > 0) {
        this.acceleration.x = (speed2.x - speed1.x) / timeDiffTotal
        this.acceleration.y = (speed2.y - speed1.y) / timeDiffTotal

        // Calculate total acceleration (magnitude)
        this.acceleration.total = sqrt(
          pow(this.acceleration.x, 2) + pow(this.acceleration.y, 2),
        )

        // Apply maximum acceleration threshold if specified
        if (this.options.maxAcceleration < Infinity) {
          // Check if we're over the threshold
          this.isOverAccelerationThreshold =
            this.acceleration.total > this.options.maxAcceleration

          // Optionally cap the acceleration at the maximum value
          if (this.options.capValues && this.isOverAccelerationThreshold) {
            const factor =
              this.options.maxAcceleration / this.acceleration.total
            this.acceleration.x *= factor
            this.acceleration.y *= factor
            this.acceleration.total = this.options.maxAcceleration
          }
        }
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
    if (this.cells.focused) {
      this.freezePointerUntilRefocus()
    }
    this.position = undefined
  }

  initEventListeners() {
    window.addEventListener('blur', this.onPointerOut.bind(this))

    this.container.addEventListener(
      'pointerdown',
      this.onPointerDown.bind(this),
    )
    this.container.addEventListener('pointerup', this.onPointerUp.bind(this))

    if (isTouchDevice) {
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
    if (this.cells.focused) {
      this.freezePointerUntilRefocus()
      Object.assign(this.pointer, {
        x: this.cells.focused.x,
        y: this.cells.focused.y,
      })
      this.dispatchEvent(new CellFocusedEvent(this.cells.focused, this.cells))
    }
  }

  dispose() {
    this.removeEventListeners()
  }
}
