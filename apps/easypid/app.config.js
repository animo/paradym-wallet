const { version } = require('./package.json')
const { createBaseConfig } = require('./base.app.config')

const mediatorDids = {
  development: 'did:web:mediator.dev.paradym.id',
  preview: 'did:web:mediator.paradym.id',
  production: 'did:web:mediator.paradym.id',
}

const APP_CONFIGS = {
  FUNKE_WALLET: createBaseConfig({
    name: 'Funke Wallet',
    scheme: 'id.animo.ausweis',
    icon: './assets/funke/icon.png',
    adaptiveIcon: './assets/funke/adaptive-icon.png',
    splash: './assets/funke/splash.png',
    slug: 'ausweis-wallet',
    version,
    bundleId: 'id.animo.ausweis',
    associatedDomains: ['funke.animo.id'],
    projectId: '28b058bb-3c4b-4347-8e72-41dfc1dd99eb',
  }),

  PARADYM_WALLET: createBaseConfig({
    name: 'Paradym Wallet',
    scheme: 'id.animo.paradym',
    icon: './assets/paradym/icon.png',
    adaptiveIcon: './assets/paradym/adaptive-icon.png',
    splash: './assets/paradym/splash.png',
    slug: 'paradym-wallet',
    version,
    bundleId: 'id.animo.paradym',
    additionalInvitationSchemes: ['didcomm'],
    associatedDomains: ['paradym.id', 'dev.paradym.id'],
    backgroundColor: '#F2F4F6',
    projectId: 'b5f457fa-bcab-4c6e-8092-8cdf1239027a',
    extraConfig: {
      mediatorDid: mediatorDids[process.env.APP_VARIANT || 'production'],
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

module.exports = () => {
  const appType = process.env.EXPO_PUBLIC_APP_TYPE
  if (!appType || !APP_CONFIGS[appType]) {
    throw new Error(`Invalid App Type: ${appType}. Must be one of: ${Object.keys(APP_CONFIGS).join(', ')}`)
  }
  return APP_CONFIGS[appType]
}
