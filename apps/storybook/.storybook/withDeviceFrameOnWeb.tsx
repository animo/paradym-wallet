import type { Decorator } from '@storybook/react'
import React from 'react'
import { DeviceFrameset } from 'react-device-frameset'
import { Platform } from 'react-native'

const withDeviceFrameOnWeb: Decorator = (Story, context) => {
  if (Platform.OS !== 'web' || context.parameters.deviceFrame !== true) return <Story />

  return (
    <DeviceFrameset device="iPhone 8" color="silver">
      <Story />
    </DeviceFrameset>
  )
}

export { withDeviceFrameOnWeb }
export default withDeviceFrameOnWeb
