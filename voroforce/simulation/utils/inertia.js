export default function inertia(opt) {
  const A = opt.time || 2000 // reference time in ms
  const limit = 1.0001
  const B = -Math.log(1 - 1 / limit)

  const inertia = {
    position: [0, 0],
    velocity: [0, 0], // in pixels/s
    time: 0,
    active: false,

    stop: () => {
      inertia.active = false
      opt.stop?.()
    },

    start: (e) => {
      inertia.position = e
      inertia.velocity = [0, 0]
      inertia.active = true
      inertia.time = 0
    },
    move: (e) => {
      const position = e
      const time = performance.now()
      const deltaTime = time - inertia.time
      const decay = 1 - Math.exp(-deltaTime / 1000)
      inertia.velocity = inertia.velocity.map((d, i) => {
        const deltaPos = position[i] - inertia.position[i]
        const deltaTime = time - inertia.time
        return (1000 * (1 - decay) * deltaPos) / deltaTime + d * decay
      })
      inertia.time = time
      inertia.position = position
    },
    end: () => {
      const v = inertia.velocity
      if (v[0] * v[0] + v[1] * v[1] < 100) {
        inertia.stop()
        return
      }

      const time = performance.now()
      const deltaTime = time - inertia.time

      if (opt.hold === undefined) opt.hold = 100 // default flick->drag threshold time (0 disables inertia)

      if (deltaTime >= opt.hold) {
        inertia.stop()
      }
    },

    update: () => {
      const time = performance.now()
      const deltaTime = time - inertia.time

      inertia.t = limit * (1 - Math.exp((-B * deltaTime) / A))
      opt.update?.(inertia.t)
      if (inertia.t > 1) {
        inertia.velocity = [0, 0]
        inertia.t = 1

        inertia.stop()
      }
    },
  }

  return inertia
}
