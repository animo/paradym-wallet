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
  'haip-vci',
  'haip-vp',
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
  './assets/mdl/code_b1.png',
  './assets/mdl/code_c.png',
  './assets/mdl/code_c1.png',
  './assets/mdl/code_a.png',
]

// ISO 18013-7 Annex C document types the wallet can present through the OS credential picker.
// Anything outside this set is filtered out before registration, so this is the only place it is
// declared.
const dcApiDocumentTypes = [
  'org.iso.18013.5.1.mDL',
  'eu.europa.ec.eudi.pid.1',
  'org.iso.23220.photoid.1',
  'eu.europa.ec.av.1',
]

// Everything the credential request UI's own bundle links. The iOS extension is a separate binary
// running on a much tighter memory budget than the app, so it links only these — the config plugin
// adds the digital credentials API module, react-native, expo and expo-modules-core itself.
//
// Native dependencies of anything here have to be listed too: unlike an exclusion list, leaving
// something out makes the extension fail to link rather than just making it heavier.
const dcApiIncludedPackages = [
  // Reachable from Credo through @digitalcredentials/jsonld-signatures.
  'expo-crypto',
  // Holds the Secure Enclave device keys mdoc DeviceAuth is signed with.
  '@animo-id/expo-secure-environment',
  // The askar store, and Credo's file system and randomness.
  '@openwallet-foundation/askar-react-native',
  'react-native-fs',
  'react-native-get-random-values',
  // The wallet key and its salt.
  'react-native-keychain',
  'react-native-safe-area-context',
  // Lingui follows the device locale when the user never picked one, and asks for its native
  // module non-optionally.
  'expo-localization',
  // Settings shared with the app: the wallet key version, which names the askar store and the
  // keychain items, and the locale. Nitro is what MMKV is built on.
  'react-native-mmkv',
  'react-native-nitro-modules',
  // What the shared UI kit renders with: the icons are svg, and the pin input gives haptic
  // feedback. Without these the request UI would be a second, hand-written UI instead of the app's
  // own components.
  //
  // Reanimated is deliberately absent: it stands up a second Hermes runtime, which this extension's
  // memory budget cannot pay for. Everything the request UI reaches animates through Tamagui's RN
  // `Animated` driver or RN `Animated` directly instead — keep it that way when adding to this
  // bundle's import graph.
  'react-native-svg',
  'expo-haptics',
  // The verifier's logo and the card art on the review screen, through `@package/ui`'s `Image`.
  'expo-image',
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
  const bundleIdentifier = `${appSpecific.bundleId}${variant.bundle}`

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
    updates: {
      fallbackToCacheTimeout: 0,
    },
    plugins: [
      'expo-web-browser',
      'expo-localization',
      [
        'react-native-edge-to-edge',
        {
          android: {
            enforceNavigationBarContrast: false,
          },
        },
      ],
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
          cameraPermission:
            '$(PRODUCT_NAME) uses the camera to scan invitation QR-codes, allowing you to receive or share cards from your wallet.',
        },
      ],
      [
        'expo-asset',
        {
          assets: [...baseAssets, ...appSpecific.assets],
        },
      ],
      [
        '@animo-id/expo-mdoc-data-transfer',
        {
          ios: {
            buildStatic: ['RNReanimated', 'RNScreens', 'askar', 'anoncreds'],
          },
        },
      ],
      [
        '@animo-id/expo-digital-credentials-api',
        {
          // The credential request UI, bundled separately from the app on both platforms.
          entry: 'src/features/dc-api/index',
          ios: {
            documentTypes: dcApiDocumentTypes,
            // One group per build variant, so dev/preview/production never share a container.
            appGroup: `group.${bundleIdentifier}`,
            // The first `keychain-access-groups` entry becomes the default group for new keychain
            // items. Keeping it equal to the bundle identifier means it matches the implicit group
            // existing react-native-keychain / expo-secure-environment items already live in, so
            // nothing has to be migrated and the extension can read them.
            keychainAccessGroup: bundleIdentifier,
            includedPackages: dcApiIncludedPackages,
            // The app is pinned to light, but the request UI is not: the OS draws the sheet's
            // title in the device's appearance and the extension cannot style it, so a light
            // request UI on a dark device leaves that title white on white.
            userInterfaceStyle: 'automatic',
            // The strip around that title is this colour, and the screen below it paints `$white`
            // from the same theme — so these are the two `$white` values, or the two do not meet.
            backgroundColor: { light: '#ffffff', dark: '#14171A' },
            // The extension is its own bundle, so the app's `UIAppFonts` do not reach it. These are
            // registered from the app's bundle at launch — read in place, not copied. Trim the list
            // to the weights the request UI actually draws with.
            fonts: [
              'OpenSans_400Regular.ttf',
              'OpenSans_500Medium.ttf',
              'OpenSans_600SemiBold.ttf',
              'OpenSans_700Bold.ttf',
              'Raleway_400Regular.ttf',
              'Raleway_500Medium.ttf',
              'Raleway_600SemiBold.ttf',
              'Raleway_700Bold.ttf',
            ],
          },
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            minSdkVersion: 26,
            compileSdkVersion: 36,
            useLegacyPackaging: true,
            extraMavenRepos: ['https://s01.oss.sonatype.org/content/repositories/snapshots/'],
          },
          ios: {
            deploymentTarget: '16.4',
            useFrameworks: 'dynamic',
            // until https://github.com/facebook/react-native/pull/54952 lands:
            // the credential request UI needs the `react-native@0.85.3` patch, which fixes
            // `RCTFontSizeMultiplier()` returning 0 inside an app extension — every named font is
            // sized to zero there, so all text that asks for a `fontFamily` draws nothing. The
            // patch is in the React Core sources, and those are only compiled when React Native is
            // built from source; the prebuilt `React.xcframework` ignores it. Costs build time.
            buildReactNativeFromSource: true,
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
            '../../node_modules/@expo-google-fonts/open-sans/400Regular/OpenSans_400Regular.ttf',
            '../../node_modules/@expo-google-fonts/open-sans/500Medium/OpenSans_500Medium.ttf',
            '../../node_modules/@expo-google-fonts/open-sans/600SemiBold/OpenSans_600SemiBold.ttf',
            '../../node_modules/@expo-google-fonts/open-sans/700Bold/OpenSans_700Bold.ttf',
            '../../node_modules/@expo-google-fonts/raleway/400Regular/Raleway_400Regular.ttf',
            '../../node_modules/@expo-google-fonts/raleway/500Medium/Raleway_500Medium.ttf',
            '../../node_modules/@expo-google-fonts/raleway/600SemiBold/Raleway_600SemiBold.ttf',
            '../../node_modules/@expo-google-fonts/raleway/700Bold/Raleway_700Bold.ttf',
          ],
        },
      ],
    ],
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier,
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
      edgeToEdgeEnabled: true,
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
          ['/invitation', '/wallet/redirect', '/oauth2/redirect'].map((path) => ({
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
    extra: {
      eas: {
        projectId,
      },
      ...extraConfig,
    },
  }
}

export { createBaseConfig, variant }
