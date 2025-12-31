import { createBaseConfig } from './base.app.config'
import { version } from './package.json'

const mediatorDids = {
  development: 'did:web:mediator.dev.paradym.id',
  preview: 'did:web:mediator.paradym.id',
  production: 'did:web:mediator.paradym.id',
}

const redirectBaseUrls = {
  development: 'https://dev.paradym.id/invitation/redirect',
  preview: 'https://paradym.id/invitation/redirect',
  production: 'https://paradym.id/invitation/redirect',
}

const APP_CONFIGS = {
  FUNKE_WALLET: createBaseConfig({
    name: 'Funke Wallet',
    scheme: 'id.animo.ausweis',
    icon: './assets/funke/icon.png',
    // NOTE: android requires paths referenced directly in code
    // to only contain _ a-Z 0-9, so we use _ for all files
    adaptiveIcon: './assets/funke/adaptive_icon.png',
    splash: './assets/funke/splash.png',
    splashIcon: './assets/funke/splash_icon.png',
    slug: 'ausweis-wallet',
    version,
    bundleId: 'id.animo.ausweis',
    associatedDomains: ['funke.animo.id'],
    projectId: '28b058bb-3c4b-4347-8e72-41dfc1dd99eb',
    assets: ['./assets/funke/icon.png'],
  }),

  PARADYM_WALLET: createBaseConfig({
    name: 'Paradym Wallet',
    scheme: 'id.animo.paradym',
    icon: './assets/paradym/icon.png',
    adaptiveIcon: './assets/paradym/adaptive_icon.png',
    splash: './assets/paradym/splash.png',
    splashIcon: './assets/paradym/splash_icon.png',
    slug: 'paradym-wallet',
    version,
    bundleId: 'id.paradym.wallet',
    additionalInvitationSchemes: ['didcomm'],
    associatedDomains: ['paradym.id', 'dev.paradym.id'],
    projectId: 'b5f457fa-bcab-4c6e-8092-8cdf1239027a',
    assets: ['./assets/paradym/icon.png'],
    extraConfig: {
      mediatorDid: mediatorDids[process.env.APP_VARIANT || 'production'],
      redirectBaseUrl: redirectBaseUrls[process.env.APP_VARIANT || 'production'],
    },
  }),
}

// Add Funke specific configurations
APP_CONFIGS.FUNKE_WALLET.ios.entitlements = {
  'com.apple.developer.kernel.increased-memory-limit': true,
}
APP_CONFIGS.FUNKE_WALLET.android.config = {
  largeHeap: true,
}

export default () => {
  const appType = process.env.EXPO_PUBLIC_APP_TYPE ?? 'PARADYM_WALLET'
  if (!appType || !APP_CONFIGS[appType]) {
    throw new Error(`Invalid App Type: ${appType}. Must be one of: ${Object.keys(APP_CONFIGS).join(', ')}`)
  }

  console.log(`Using app config for app ${appType}`)
  return APP_CONFIGS[appType]
}
