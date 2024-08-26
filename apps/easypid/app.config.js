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
  name: `EasyPID${variant.name}`,
  scheme: 'animo-easypid',
  slug: 'ausweis-wallet',
  owner: 'animo-id',
  version,
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  androidStatusBar: {
    backgroundColor: '#00000000',
    barStyle: 'light-content',
  },
  androidNavigationBar: {
    backgroundColor: '#2445CD',
  },
  splash: {
    image: './assets/splash.png',
    resizeMode: 'cover',
    backgroundColor: '#2445CD',
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  plugins: [
    '@animo-id/expo-ausweis-sdk',
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 26,
          useLegacyPackaging: true,
        },
      },
    ],
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
    bundleIdentifier: `id.animo.ausweis${variant.bundle}`,
    infoPlist: {
      NSPhotoLibraryUsageDescription: 'EasyPID uses the camera to initiate receiving and sharing of credentials.',
      NSCameraUsageDescription: 'EasyPID uses the camera to initiate receiving and sharing of credentials.',
      NSFaceIDUsageDescription: 'EasyPID uses FaceID to securely unlock the wallet and share credentials.',
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
    package: `id.animo.ausweis${variant.bundle}`,
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
      projectId: '28b058bb-3c4b-4347-8e72-41dfc1dd99eb',
    },
  },
}

export default config
