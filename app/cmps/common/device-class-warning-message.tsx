import { type DEVICE_CLASS, DEVICE_CLASSES } from '../../vf/consts'
import { isDefined } from '../../utls/misc'

export const DeviceClassWarningMessage = ({
  deviceClass,
}: { deviceClass?: DEVICE_CLASS }) => {
  const deviceClassItem = isDefined(deviceClass)
    ? DEVICE_CLASSES.find((item) => item.id === deviceClass)
    : undefined

  return (
    <>
      Not recommended{' '}
      {deviceClassItem && (
        <>
          for {deviceClassItem.name}{' '}
          {/*<span className='!font-bold text-white'>{deviceClassItem.name}</span>{' '}*/}
          devices
        </>
      )}
    </>
  )
}
