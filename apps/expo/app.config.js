/* eslint-disable */
const APP_VARIANT = process.env.APP_VARIANT || 'production'

const variants = {
  development: {
    bundle: '.dev',
    name: ' (Dev)',
  },
  preview: {
    bundle: '.preview',
    name: ' (Preview)',
  },
  production: {
    bundle: '',
    name: '',
  },
}

const variant = variants[APP_VARIANT]

if (!variant) {
  throw new Error('Invalid variant provided: ' + process.env.APP_VARIANT)
}

const openIdSchemes = ['openid', 'openid-initiate-issuance', 'openid-credential-offer']

/**
 * @type {import('@expo/config-types').ExpoConfig}
 */
const config = {
  name: 'Paradym Wallet' + variant.name,
  scheme: 'paradym',
  slug: 'paradym-wallet',
  owner: 'animo-id',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  androidStatusBar: {
    backgroundColor: '#F2F4F6',
    translucent: false,
  },
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'id.paradym.wallet' + variant.bundle,
    infoPlist: {
      NSCameraUsageDescription: 'This app uses the camera to scan QR-codes.',
      ITSAppUsesNonExemptEncryption: false,
      // Add schemes for deep linking
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: openIdSchemes,
        },
      ],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    package: 'id.paradym.wallet' + variant.bundle,
    intentFilters: [
      ...openIdSchemes.map((scheme) => ({
        action: 'VIEW',
        category: ['BROWSABLE', 'DEFAULT'],
        data: {
          scheme,
          host: '*',
          pathPrefix: '/',
          pathPattern: '.*',
        },
      })),
    ],
  },
  extra: {
    eas: {
      projectId: 'b5f457fa-bcab-4c6e-8092-8cdf1239027a',
    },
  },
}

export default config
