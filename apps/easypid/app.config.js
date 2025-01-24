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
const invitationSchemes = [
  'openid',
  'openid-initiate-issuance',
  'openid-credential-offer',
  'openid-vc',
  'openid4vp',
  'id.animo.ausweis',
  'haip',
]

const associatedDomains = ['funke.animo.id']

/**
 * @type {import('@expo/config-types').ExpoConfig}
 */
const config = {
  name: `EasyPID${variant.name}`,
  scheme: 'id.animo.ausweis',
  slug: 'ausweis-wallet',
  owner: 'animo-id',
  version,
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  androidStatusBar: {
    backgroundColor: '#FFFFFF',
    barStyle: 'light-content',
  },
  androidNavigationBar: {
    backgroundColor: '#FFFFFF',
  },
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  plugins: [
    '@animo-id/expo-ausweis-sdk',
    [
      '@animo-id/expo-mdoc-data-transfer',
      {
        ios: {
          buildStatic: ['RNReanimated', 'RNScreens', 'aries-askar', 'anoncreds', 'react-native-executorch'],
        },
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'Allow $(PRODUCT_NAME) to access your camera.',
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 26,
          useLegacyPackaging: true,
          extraMavenRepos: ['https://s01.oss.sonatype.org/content/repositories/snapshots/'],
        },
        ios: {
          deploymentTarget: '15.1',
          useFrameworks: 'dynamic',
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
    associatedDomains: associatedDomains.map((host) => `applinks:${host}`),
    entitlements: {
      'com.apple.developer.kernel.increased-memory-limit': true,
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
      ...associatedDomains.flatMap((host) =>
        ['/invitation', '/wallet/redirect'].map((path) => ({
          action: 'VIEW',
          category: ['DEFAULT', 'BROWSABLE'],
          autoVerify: true,
          data: {
            scheme: 'https',
            host,
            pathPrefix: path,
          },
        }))
      ),
    ],
    config: {
      largeHeap: true,
    },
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
