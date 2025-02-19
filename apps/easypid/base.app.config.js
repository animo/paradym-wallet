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
    additionalInvitationSchemes = [],
    associatedDomains = [],
    backgroundColor = '#FFFFFF',
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
    androidStatusBar: {
      backgroundColor,
      barStyle: 'light-content',
    },
    androidNavigationBar: {
      backgroundColor,
    },
    splash: {
      image: splash,
      resizeMode: 'contain',
      backgroundColor,
    },
    updates: {
      fallbackToCacheTimeout: 0,
    },
    plugins: [
      'expo-router',
      [
        'expo-camera',
        {
          cameraPermission: 'Allow $(PRODUCT_NAME) to access your camera.',
        },
      ],
      // FIXME: Should be removed for the Paradym Wallet but it causes build errors if it's not installed
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
    ],
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: `${appSpecific.bundleId}${variant.bundle}`,
      infoPlist: {
        NSCameraUsageDescription: `${name} uses the camera to initiate receiving and sharing of credentials.`,
        NSFaceIDUsageDescription: `${name} uses FaceID to securely unlock the wallet and share credentials.`,
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
      adaptiveIcon: {
        foregroundImage: adaptiveIcon,
        backgroundColor,
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
