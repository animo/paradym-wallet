import { APP_CONFIGS } from './features'

export type AppType = keyof typeof APP_CONFIGS
export const appTypes = Object.keys(APP_CONFIGS)

const getAppType = (): AppType => {
  let appType = process.env.EXPO_PUBLIC_APP_TYPE as AppType

  if (!appType) {
    console.warn('⚠️ EXPO_PUBLIC_APP_TYPE not set, falling back to PARADYM_WALLET')
    appType = 'PARADYM_WALLET'
  }

  if (!appTypes.includes(appType)) {
    console.warn(`⚠️ EXPO_PUBLIC_APP_TYPE is not a valid app type: ${appType}. Falling back to PARADYM_WALLET.`)
    appType = 'PARADYM_WALLET'
  }

  const features = APP_CONFIGS[appType]
  const sortedFeatures = Object.entries(features).sort(([, a], [, b]) => (b ? 1 : 0) - (a ? 1 : 0))

  console.log(`
    🔧 App Configuration
    ━━━━━━━━━━━━━━━━━━━━
    📱 App Type: ${appType}
     ⚙️ Features:${sortedFeatures
       .map(
         ([key, value]) => `
        - ${key}: ${value ? '✅' : '❌'}`
       )
       .join('')}`)

  return appType as AppType
}

export const CURRENT_APP_TYPE = getAppType()
