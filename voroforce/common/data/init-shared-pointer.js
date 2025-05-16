import { arrayBuffer } from '../../utils'
import { SharedPointer } from './shared-pointer'

export const initSharedPointer = (config) => {
  const sharedPointerBuffer = arrayBuffer(
    10 * 4,
    config.multiThreading?.enabled,
  )
  const sharedPointerArray = new Float32Array(sharedPointerBuffer)
  const sharedPointer = new SharedPointer(sharedPointerArray)
  return {
    sharedPointerBuffer,
    sharedPointerArray,
    sharedPointer,
  }
}
