import SharedCell from '../data/shared-cell'
import SharedCellCollection from '../data/shared-cell-collection'
import { SharedData } from '../data/shared-data'
import { SharedLoadedMediaVersionLayersData } from '../data/shared-loaded-media-version-layers-data'
import { SharedPointer } from '../data/shared-pointer'
import { Dimensions } from './dimensions'

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

export class Store extends EventTarget {
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
      sharedCellCoords,
      sharedCellAttributes,
      sharedCellWeights,
      sharedCellIds,
      sharedCellMediaVersions,
      sharedCellCollectionAttributes,
      sharedLoadedMediaVersionLayersDataArrays,
    } = state
    return new Store(state)
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
      .set(
        'sharedLoadedMediaVersionLayersData',
        sharedLoadedMediaVersionLayersDataArrays?.map(
          (arr) => new SharedLoadedMediaVersionLayersData(arr),
        ),
      )
  }

  getSimulationWorkerConfig() {
    // display config can contain big shaders
    const { display: _, ...config } = this.get('config')
    return config
  }

  getSimulationWorkerState() {
    // remove non-transferable
    const { ticker, dimensions, loader, container, canvas, config, ...rest } =
      this.#state

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
