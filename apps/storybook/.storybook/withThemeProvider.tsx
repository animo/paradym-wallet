import { TamaguiProvider } from '@package/ui'
import type { Decorator } from '@storybook/react'
import React from 'react'

import funkeConfig from '../../funke/tamagui.config'
import paradymConfig from '../../paradym/tamagui.config'

const configs = {
  funke: funkeConfig,
  paradym: paradymConfig,
}

const withThemeProvider: Decorator = (Story, context) => {
  const configName = context.parameters.theme ?? 'funke'

  const config = configs[configName]
  if (!config)
    throw new Error(`Theme with name ${configName} does not exist. Valid themes are ${Object.keys(configs).join(', ')}`)

  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <Story {...context} />
    </TamaguiProvider>
  )
}

export default withThemeProvider
