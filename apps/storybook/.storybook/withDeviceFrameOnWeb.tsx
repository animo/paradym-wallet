import type { Decorator } from '@storybook/react'
import React, { type NamedExoticComponent, useEffect, useState } from 'react'
import { Platform } from 'react-native'

// TODO: register by default and allow to configure through parameters to disable device set per component
import type { DeviceFramesetProps } from 'react-device-frameset'

const withDeviceFrameOnWeb: Decorator = (Story, context) => {
  if (Platform.OS !== 'web') return <Story {...context} />

  const [DeviceFrameset, setDeviceFrameset] = useState<NamedExoticComponent<DeviceFramesetProps>>()
  useEffect(() => {
    if (DeviceFrameset) return
    // @ts-ignore
    import('react-device-frameset').then((component) => setDeviceFrameset(component.DeviceFrameset))
  }, [DeviceFrameset])

  if (!DeviceFrameset) return <></>

  return (
    <DeviceFrameset
      device="iPhone 8"
      color="silver"
      style={{
        paddingTop: 20,
      }}
    >
      <Story {...context} />
    </DeviceFrameset>
  )
}

export { withDeviceFrameOnWeb }
export default withDeviceFrameOnWeb
