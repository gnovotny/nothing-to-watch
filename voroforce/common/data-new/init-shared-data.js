import { arrayBuffer } from '../../utils'
import { SharedData } from './shared-data'

export const initSharedData = (config) => {
  const sharedDataBuffer = arrayBuffer(3 * 4, config.multiThreading?.enabled)
  const sharedDataArray = new Float32Array(sharedDataBuffer)
  const sharedData = new SharedData(sharedDataArray)
  return {
    sharedDataBuffer,
    sharedDataArray,
    sharedData,
  }
}
