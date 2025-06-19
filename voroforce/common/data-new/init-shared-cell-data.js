import { arrayBuffer } from '../../utils'
import { SharedCell } from './shared-cell'
import { SharedCellCollection } from './shared-cell-collection'

const getNumCellsFromOptions = (cellOptions) =>
  Array.isArray(cellOptions) ? cellOptions.length : Math.abs(cellOptions)

const initSharedCellMediaVersionsData = (cellOptions, config) => {
  const numCells = getNumCellsFromOptions(cellOptions)

  const lenSqrd = Math.ceil(Math.sqrt(numCells))
  const sharedCellMediaVersionsTextureWidth = lenSqrd
  const sharedCellMediaVersionsTextureHeight = lenSqrd

  const sharedCellMediaVersionsBuffer = arrayBuffer(
    sharedCellMediaVersionsTextureHeight *
      sharedCellMediaVersionsTextureWidth *
      4, // Uint16Array = 2 bytes per element, but we have RG (media version & target media version)
    config.multiThreading?.enabled,
  )
  const sharedCellMediaVersions = new Uint16Array(sharedCellMediaVersionsBuffer)

  return {
    sharedCellMediaVersionsBuffer,
    sharedCellMediaVersions,
    sharedCellMediaVersionsTextureWidth,
    sharedCellMediaVersionsTextureHeight,
  }
}

const initSharedCellIdsData = (cellOptions, config) => {
  const numCells = getNumCellsFromOptions(cellOptions)

  const lenSqrd = Math.ceil(Math.sqrt(numCells))
  const sharedCellIdsTextureWidth = lenSqrd
  const sharedCellIdsTextureHeight = lenSqrd

  const sharedCellIdsBuffer = arrayBuffer(
    sharedCellIdsTextureHeight * sharedCellIdsTextureWidth * 4, // 4 bytes
    config.multiThreading?.enabled,
  )
  const sharedCellIds = new Uint32Array(sharedCellIdsBuffer)

  return {
    sharedCellIdsBuffer,
    sharedCellIds,
    sharedCellIdsTextureWidth,
    sharedCellIdsTextureHeight,
  }
}

const initSharedCellWeightsData = (cellOptions, config) => {
  const numCells = getNumCellsFromOptions(cellOptions)

  const lenSqrd = Math.ceil(Math.sqrt(numCells))
  const sharedCellWeightsTextureWidth = lenSqrd
  const sharedCellWeightsTextureHeight = lenSqrd

  const sharedCellWeightsBuffer = arrayBuffer(
    sharedCellWeightsTextureHeight * sharedCellWeightsTextureWidth * 4, // 4 bytes
    config.multiThreading?.enabled,
  )
  const sharedCellWeights = new Float32Array(sharedCellWeightsBuffer)

  return {
    sharedCellWeightsBuffer,
    sharedCellWeights,
    sharedCellWeightsTextureWidth,
    sharedCellWeightsTextureHeight,
  }
}

const initSharedCellNeighborsData = (cellOptions, config) => {
  const numCells = getNumCellsFromOptions(cellOptions)

  let maxNeighbors = 8

  const levels = config.simulation?.steps?.neighbors?.levels
  switch (levels) {
    case 2:
      maxNeighbors = 24
      break
    case 3:
      maxNeighbors = 48
      break
    case 4:
      maxNeighbors = 80
      break
  }

  const cellNeighborsReservedSize = 2 + Math.min(maxNeighbors, numCells)
  const lenSqrd = Math.ceil(Math.sqrt(numCells * cellNeighborsReservedSize))
  const sharedCellNeighborsTextureWidth = lenSqrd
  const sharedCellNeighborsTextureHeight = lenSqrd

  const sharedCellNeighborsBuffer = arrayBuffer(
    sharedCellNeighborsTextureHeight * sharedCellNeighborsTextureWidth * 4, // 4 bytes
    config.multiThreading?.enabled,
  )
  const sharedCellNeighbors = new Uint32Array(sharedCellNeighborsBuffer)

  return {
    sharedCellNeighborsTextureWidth,
    sharedCellNeighborsTextureHeight,
    sharedCellNeighborsBuffer,
    sharedCellNeighbors,
  }
}

const initSharedCellCoordsData = (cellOptions, config) => {
  const numCells = getNumCellsFromOptions(cellOptions)

  const lenSqrd = Math.ceil(Math.sqrt(numCells /* * 2*/))
  const sharedCellCoordsTextureWidth = lenSqrd
  const sharedCellCoordsTextureHeight = lenSqrd

  // x, y
  const sharedCellCoordsBuffer = arrayBuffer(
    // numCells * 8, // 4 bytes per float
    sharedCellCoordsTextureHeight * sharedCellCoordsTextureWidth * 2 * 4, // 4 bytes
    config.multiThreading,
  )
  const sharedCellCoords = new Float32Array(sharedCellCoordsBuffer)

  return {
    sharedCellCoordsTextureWidth,
    sharedCellCoordsTextureHeight,
    sharedCellCoordsBuffer,
    sharedCellCoords,
  }
}

export const initSharedCellData = (cellOptions, config) => {
  const numCells = getNumCellsFromOptions(cellOptions)

  // vx, vy, fx, fy, targetFx, targetFy, ix, iy, row, col, targetMediaVersion
  const sharedCellAttributes = new Float32Array(
    arrayBuffer(11 * numCells * 4, config.multiThreading?.enabled),
  )

  // focused, selected, dragging
  const sharedCellCollectionAttributes = new Float32Array(
    arrayBuffer(3 * 4, config.multiThreading?.enabled),
  ).fill(-1)

  const cellCoordsData = initSharedCellCoordsData(cellOptions, config)

  const cellWeightsData = initSharedCellWeightsData(cellOptions, config)
  const cellIdsData = initSharedCellIdsData(cellOptions, config)
  const cellMediaVersionsData = initSharedCellMediaVersionsData(
    cellOptions,
    config,
  )

  const cells = SharedCellCollection.from(
    (Array.isArray(cellOptions) ? cellOptions : [...Array(numCells)]).map(
      (d, index) =>
        new SharedCell(
          {
            id: index,
            index: index,
            group: index,
          },
          cellCoordsData.sharedCellCoords,
          sharedCellAttributes,
          cellWeightsData.sharedCellWeights,
          cellMediaVersionsData.sharedCellMediaVersions,
          cellIdsData.sharedCellIds,
        ),
    ),
    sharedCellCollectionAttributes,
  )

  return {
    cells,
    sharedCellAttributes,
    sharedCellCollectionAttributes,
    ...cellCoordsData,
    ...cellMediaVersionsData,
    ...cellWeightsData,
    ...cellIdsData,
    ...initSharedCellNeighborsData(cellOptions, config),
  }
}
