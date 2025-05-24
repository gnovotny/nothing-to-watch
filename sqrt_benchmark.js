const buffer = new ArrayBuffer(4)
const ui32 = new Uint32Array(buffer)
const f32 = new Float32Array(buffer)

function Q_rsqrt(number) {
  f32[0] = number
  ui32[0] = 0x5f3759df - (ui32[0] >> 1)
  const x = f32[0]
  return x * (1.5 - 0.5 * x * x * number)
}

// function approxSqrt(x, iterations = 3) {
//   let guess = x / 2
//   for (let i = 0; i < iterations; i++) {
//     guess = (guess + x / guess) / 2
//   }
//   return guess
// }

const approxSqrt = (x) => {
  return x
}

let qTotal = 0,
  sTotal = 0,
  aTotal = 0
// const iters = 999999999
const iters = 10000000

for (let i = 0; i < iters; ++i) {
  const s = Date.now()
  1 / Q_rsqrt(i + 1)
  qTotal += Date.now() - s
}

for (let i = 0; i < iters; ++i) {
  const s = Date.now()
  Math.sqrt(i + 1)
  sTotal += Date.now() - s
}

for (let i = 0; i < iters; ++i) {
  const s = Date.now()
  approxSqrt(i + 1)
  aTotal += Date.now() - s
}

console.log('Q_rsqrt:', qTotal)
console.log('1 / Math.sqrt:', sTotal)
console.log('approxSqrt:', aTotal)
