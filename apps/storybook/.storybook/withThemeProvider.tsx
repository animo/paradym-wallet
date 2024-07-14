import React from 'react'
import { TamaguiProvider } from '@package/ui'
import { useColorScheme } from 'react-native'
import type { Decorator } from '@storybook/react'

// TODO: make custom decorator that allows changing this from within the storybook UI. But
// requires quite some boilerplate
// You can change the theme used in the storybook
// import funkeConfig from '../../funke/tamagui.config'
import paradymConfig from '../../paradym/tamagui.config'

const withThemeProvider: Decorator = (Story, context) => {
  const scheme = useColorScheme()
  return (
    <TamaguiProvider config={paradymConfig} defaultTheme={scheme === 'dark' ? 'dark' : 'light'}>
      <Story {...context} />
    </TamaguiProvider>
  )
}

export default withThemeProvider
