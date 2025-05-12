import { arrayBuffer } from '../../utils'
import { SharedData } from './shared-data'
import { SharedPointer } from './shared-pointer'

export const initSharedData = (config) => {
  const sharedDataBuffer = arrayBuffer(10 * 4, config.multiThreading?.enabled)
  const sharedDataArray = new Float32Array(sharedDataBuffer)
  const sharedData = new SharedData(sharedDataArray)
  const sharedPointer = new SharedPointer(sharedDataArray)
  return {
    sharedDataBuffer,
    sharedDataArray,
    sharedData,
    sharedPointer,
  }
}
