import { type DEVICE_CLASS, DEVICE_CLASS_ITEMS } from '../../../vf/consts'
import { isDefined } from '../../../utils/misc'

export const DeviceClassWarningMessage = ({
  deviceClass,
}: { deviceClass?: DEVICE_CLASS }) => {
  const deviceClassItem = isDefined(deviceClass)
    ? DEVICE_CLASS_ITEMS.find((item) => item.id === deviceClass)
    : undefined

  return (
    <>
      Not recommended{' '}
      {deviceClassItem && (
        <>
          for <span className='whitespace-nowrap'>{deviceClassItem.name}</span>{' '}
          devices
        </>
      )}
    </>
  )
}
