import { CustomEventTarget } from '../../utils/custom-event-target'
import {
  SharedCell,
  SharedCellCollection,
  SharedData,
  SharedLoadedMediaVersionLayersData,
  SharedPointer,
} from '../data'
import { Dimensions } from './dimensions'

function stripFunctions(obj) {
  if (typeof obj !== 'object' || obj === null) return obj

  if (Array.isArray(obj)) {
    return obj.map(stripFunctions)
  }

  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value !== 'function') {
      result[key] = stripFunctions(value)
    }
  }
  return result
}

class StoreEvent extends Event {
  constructor(state = {}) {
    super('state')
    this.state = state
  }
}

class CustomStoreEvent extends Event {
  constructor(key, value) {
    super(`${key}`)
    this.value = value
  }
}

export class Store extends CustomEventTarget {
  #state

  constructor(initialState) {
    super()
    this.#state = initialState
  }

  setState(...args) {
    if (args.length > 1) {
      this.#state[args[0]] =
        typeof args[1] === 'function' ? args[1](this.#state[args[0]]) : args[1]
      this.dispatchEvent(new CustomStoreEvent(args[0], this.#state[args[0]]))
    } else {
      Object.assign(
        this.#state,
        typeof args[0] === 'function' ? args[0](this.#state) : args[0],
      )
    }

    this.dispatchEvent(new StoreEvent(this.#state))
  }

  set(...args) {
    this.setState(...args)
    return this
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

  static fromSimulationWorkerState(state) {
    const {
      dimensions,
      cells,
      sharedDataArray,
      sharedPointerArray,
      sharedCellCoords,
      sharedCellAttributes,
      sharedCellWeights,
      sharedCellIds,
      sharedCellMediaVersions,
      sharedCellCollectionAttributes,
      sharedLoadedMediaVersionLayersDataArrays,
    } = state
    return (
      new Store(state)
        .set('dimensions', new Dimensions(null, dimensions))
        .set(
          'cells',
          SharedCellCollection.from(
            cells.map(
              (cell) =>
                new SharedCell(
                  cell,
                  sharedCellCoords,
                  sharedCellAttributes,
                  sharedCellWeights,
                  sharedCellMediaVersions,
                  sharedCellIds,
                ),
            ),
            sharedCellCollectionAttributes,
          ),
        )
        .set('sharedData', new SharedData(sharedDataArray))
        .set('sharedPointer', new SharedPointer(sharedDataArray))
        // .set('sharedPointer', new SharedPointer(sharedPointerArray))
        .set(
          'sharedLoadedMediaVersionLayersData',
          sharedLoadedMediaVersionLayersDataArrays?.map(
            (arr) => new SharedLoadedMediaVersionLayersData(arr),
          ),
        )
    )
  }

  getSimulationWorkerConfig() {
    // display config can contain classes and big shaders
    const { display: _, media, ...config } = this.get('config')
    config.media = stripFunctions(media)
    return config
  }

  getSimulationWorkerState() {
    // remove non-transferable
    const {
      ticker,
      dimensions,
      loader,
      controls,
      container,
      canvas,
      config,
      ...rest
    } = this.#state

    return {
      ...rest,
      config: this.getSimulationWorkerConfig(),
      dimensions: dimensions?.getState(),
    }
  }

  dispose() {
    this.#state = null
  }
}
