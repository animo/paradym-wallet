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
const baseInvitationSchemes = [
  'openid',
  'openid-initiate-issuance',
  'openid-credential-offer',
  'openid-vc',
  'openid4vp',
  'eudi-openid4vp',
  'mdoc-openid4vp',
  'haip',
]

const baseAssets = [
  './assets/german_issuer_image.png',
  './assets/pid_background.jpg',
  './assets/mdl/code_l.png',
  './assets/mdl/code_t.png',
  './assets/mdl/code_d1e.png',
  './assets/mdl/code_de.png',
  './assets/mdl/code_be.png',
  './assets/mdl/code_c1e.png',
  './assets/mdl/code_ce.png',
  './assets/mdl/code_a2.png',
  './assets/mdl/code_am.png',
  './assets/mdl/code_a1.png',
  './assets/mdl/code_d.png',
  './assets/mdl/code_d1.png',
  './assets/mdl/code_b.png',
  './assets/mdl/code_c.png',
  './assets/mdl/code_c1.png',
  './assets/mdl/code_a.png',
]
/**
 * Creates a base configuration that can be extended by specific apps
 * @param {Object} appSpecific - App specific configuration
 * @returns {import('@expo/config-types').ExpoConfig}
 */
const createBaseConfig = (appSpecific) => {
  const {
    name,
    scheme,
    slug,
    adaptiveIcon,
    icon,
    splash,
    splashIcon,
    additionalInvitationSchemes = [],
    associatedDomains = [],
    projectId,
    extraConfig = {},
  } = appSpecific

  const invitationSchemes = [...baseInvitationSchemes, ...additionalInvitationSchemes, scheme]

  return {
    name: `${name}${variant.name}`,
    scheme,
    slug,
    owner: 'animo-id',
    version: appSpecific.version,
    orientation: 'portrait',
    icon,
    userInterfaceStyle: 'light',
    backgroundColor: '#FFFFFF',
    androidStatusBar: {
      translucent: true,
    },
    updates: {
      fallbackToCacheTimeout: 0,
    },
    plugins: [
      [
        'expo-splash-screen',
        {
          backgroundColor: '#F2F4F6',
          image: adaptiveIcon ?? splashIcon,
          imageWidth: 200,
          ios: {
            image: splash,
            resizeMode: 'cover',
            enableFullScreenImage_legacy: true,
            backgroundColor: '#FFFFFF',
          },
        },
      ],
      'expo-secure-store',
      'expo-router',
      [
        'expo-camera',
        {
          cameraPermission: 'Allow $(PRODUCT_NAME) to access your camera.',
        },
      ],
      [
        'expo-asset',
        {
          assets: [...baseAssets, ...appSpecific.assets],
        },
      ],
      '@animo-id/expo-ausweis-sdk',
      [
        '@animo-id/expo-mdoc-data-transfer',
        {
          ios: {
            buildStatic: ['RNReanimated', 'RNScreens', 'askar', 'anoncreds', 'react-native-executorch'],
          },
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            minSdkVersion: 26,
            compileSdkVersion: 35,
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
        'expo-dev-client',
        {
          launchMode: 'most-recent',
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
    ],
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: `${appSpecific.bundleId}${variant.bundle}`,
      infoPlist: {
        NSCameraUsageDescription: `${name} uses the camera to initiate receiving and sharing of credentials.`,
        NSFaceIDUsageDescription: `${name} uses FaceID to securely unlock the wallet and share credentials.`,
        NSPhotoLibraryUsageDescription: `${name} requires photo library access for credential sharing functionality.`,
        ITSAppUsesNonExemptEncryption: false,
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: invitationSchemes,
          },
        ],
      },
      associatedDomains: associatedDomains.map((host) => `applinks:${host}`),
    },
    android: {
      allowBackup: false,
      adaptiveIcon: {
        foregroundImage: adaptiveIcon,
      },
      package: `${appSpecific.bundleId}${variant.bundle}`,
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
    },
    experiments: {
      tsconfigPaths: true,
    },
    extra: {
      eas: {
        projectId,
      },
      ...extraConfig,
    },
  }
}

module.exports = { createBaseConfig, variant }
