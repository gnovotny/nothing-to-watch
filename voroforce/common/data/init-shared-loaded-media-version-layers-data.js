import { arrayBuffer } from '../../utils/array-buffer'
import { SharedLoadedMediaVersionLayersData } from './shared-loaded-media-version-layers-data'

export const initSharedLoadedMediaVersionLayersData = (config) => {
  const sharedLoadedMediaVersionLayersDataBuffers = config.media.versions.map(
    (version) =>
      arrayBuffer(version.layers * 2, config.multiThreading?.enabled),
  )
  const sharedLoadedMediaVersionLayersDataArrays =
    sharedLoadedMediaVersionLayersDataBuffers.map(
      (buffer) => new Uint16Array(buffer),
    )

  const sharedLoadedMediaVersionLayersData =
    sharedLoadedMediaVersionLayersDataArrays.map(
      (array) => new SharedLoadedMediaVersionLayersData(array),
    )

  return {
    sharedLoadedMediaVersionLayersDataBuffers,
    sharedLoadedMediaVersionLayersDataArrays,
    sharedLoadedMediaVersionLayersData,
  }
}
