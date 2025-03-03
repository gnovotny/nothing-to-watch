export const LATTICE_DIRECTIONS = [
  // [-1, -1],
  // [-1, 0],
  // [-1, 1],
  // [0, -1],
  // [0, 1],
  // [1, -1],
  // [1, 0],
  // [1, 1],

  // [-1, -1],
  // [-1, 0],
  // [-1, 1],
  // [0, 1],
  // [1, 1],
  // [1, -1],
  // [1, 0],
  // [0, -1],

  [-1, -1],
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
]

export const getNeighborIndexByLatticeOffset = (x, y, latticeConfig) => {
  const { rows, cols, numCells } = latticeConfig
  if (x < 0 || y < 0 || x > cols - 1 || y > rows - 1) return -1

  const neighborIndex = y * cols + x
  if (neighborIndex > numCells - 1) return -1
  return neighborIndex
}
