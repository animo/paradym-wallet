const { version } = require('./package.json')

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
  throw new Error(`Invalid variant provided: ${process.env.APP_VARIANT}`)
}

// NOTE: Keep this in sync with the `QrTypes` enum
const invitationSchemes = ['openid', 'openid-initiate-issuance', 'openid-credential-offer', 'openid-vc', 'openid4vp']

/**
 * @type {import('@expo/config-types').ExpoConfig}
 */
const config = {
  name: `Funke Wallet${variant.name}`,
  scheme: 'funke',
  slug: 'funke-wallet',
  owner: 'animo-id',
  version,
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  androidStatusBar: {
    backgroundColor: '#F2F4F6',
  },
  androidNavigationBar: {
    backgroundColor: '#F2F4F6',
  },
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#F2F4F6',
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  plugins: [
    '@animo-id/expo-ausweis-sdk',
    [
      'expo-font',
      {
        fonts: [
          '../../node_modules/@expo-google-fonts/open-sans/OpenSans_400Regular.ttf',
          '../../node_modules/@expo-google-fonts/open-sans/OpenSans_500Medium.ttf',
          '../../node_modules/@expo-google-fonts/open-sans/OpenSans_600SemiBold.ttf',
          '../../node_modules/@expo-google-fonts/open-sans/OpenSans_700Bold.ttf',
          '../../node_modules/@expo-google-fonts/raleway/Raleway_400Regular.ttf',
          '../../node_modules/@expo-google-fonts/raleway/Raleway_500Medium.ttf',
          '../../node_modules/@expo-google-fonts/raleway/Raleway_600SemiBold.ttf',
          '../../node_modules/@expo-google-fonts/raleway/Raleway_700Bold.ttf',
        ],
      },
    ],
    'expo-router',
  ],
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: `id.animo.funke.wallet${variant.bundle}`,
    infoPlist: {
      NSCameraUsageDescription: 'Funke Wallet uses the camera to initiate receiving and sharing of credentials.',
      NSFaceIDUsageDescription: 'Funke Wallet uses FaceID to securely unlock the wallet and share credentials.',
      ITSAppUsesNonExemptEncryption: false,
      // Add schemes for deep linking
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: invitationSchemes,
        },
      ],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    package: `id.animo.funke.wallet${variant.bundle}`,
    intentFilters: [
      ...invitationSchemes.map((scheme) => ({
        action: 'VIEW',
        category: ['DEFAULT', 'BROWSABLE'],
        data: {
          scheme,
        },
      })),
    ],
  },
  experiments: {
    tsconfigPaths: true,
  },
  extra: {
    eas: {
      projectId: 'todo',
    },
  },
}

export default config
