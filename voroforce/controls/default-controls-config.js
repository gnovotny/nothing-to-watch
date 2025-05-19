export const defaultControlsConfig = {
  autoFocusCenter: {
    enabled: 'touch', // true, false or 'touch'
    random: false,
  },
  // todo outdated
  maxPointerSpeed: 0.5, // percentage of diagonal per second (px/s)
  pointerRadius: 0.5, // percentage of diagonal,

  raw: false,
  // maxSpeed: 200,
  maxSpeed: 10,
  // Minimum speed to maintain when close to target (prevents snapping)
  minSpeed: 2,
  ease: 0.15, // smoothing factor

  capValues: true,
  freezeOnShake: {
    enabled: true,
  },
  freezeOnJolt: {
    enabled: true,
  },
}
