const { version } = require('./package.json')

const APP_VARIANT = process.env.APP_VARIANT || 'production'

// https://demo.pid-issuer.bundesdruckerei.de
const bdrPidIssuerCertificate = `-----BEGIN CERTIFICATE-----
MIICeTCCAiCgAwIBAgIUB5E9QVZtmUYcDtCjKB/H3VQv72gwCgYIKoZIzj0EAwIwgYgxCzAJBgNVBAYTAkRFMQ8wDQYDVQQHDAZCZXJsaW4xHTAbBgNVBAoMFEJ1bmRlc2RydWNrZXJlaSBHbWJIMREwDwYDVQQLDAhUIENTIElERTE2MDQGA1UEAwwtU1BSSU5EIEZ1bmtlIEVVREkgV2FsbGV0IFByb3RvdHlwZSBJc3N1aW5nIENBMB4XDTI0MDUzMTA2NDgwOVoXDTM0MDUyOTA2NDgwOVowgYgxCzAJBgNVBAYTAkRFMQ8wDQYDVQQHDAZCZXJsaW4xHTAbBgNVBAoMFEJ1bmRlc2RydWNrZXJlaSBHbWJIMREwDwYDVQQLDAhUIENTIElERTE2MDQGA1UEAwwtU1BSSU5EIEZ1bmtlIEVVREkgV2FsbGV0IFByb3RvdHlwZSBJc3N1aW5nIENBMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEYGzdwFDnc7+Kn5ibAvCOM8ke77VQxqfMcwZL8IaIA+WCROcCfmY/giH92qMru5p/kyOivE0RC/IbdMONvDoUyaNmMGQwHQYDVR0OBBYEFNRWGMCJOOgOWIQYyXZiv6u7xZC+MB8GA1UdIwQYMBaAFNRWGMCJOOgOWIQYyXZiv6u7xZC+MBIGA1UdEwEB/wQIMAYBAf8CAQAwDgYDVR0PAQH/BAQDAgGGMAoGCCqGSM49BAMCA0cAMEQCIGEm7wkZKHt/atb4MdFnXW6yrnwMUT2u136gdtl10Y6hAiBuTFqvVYth1rbxzCP0xWZHmQK9kVyxn8GPfX27EIzzsw==
-----END CERTIFICATE-----`

// https://funke.animo.id
const animoFunkeRelyingPartyCertificate =
  'MIIBAzCBq6ADAgECAhArxq0w60RTDK4WY9HzgcvBMAoGCCqGSM49BAMCMAAwIBcNNzAwMTAxMDAwMDAwWhgPMjI4NjExMjAxNzQ2NDBaMAAwOTATBgcqhkjOPQIBBggqhkjOPQMBBwMiAALcD1XzKepFxWMAOqV+ln1fybBt7DRO5CV0f9A6mRp2xaMlMCMwIQYDVR0RBBowGIYWaHR0cHM6Ly9mdW5rZS5hbmltby5pZDAKBggqhkjOPQQDAgNHADBEAiAfvGG6sqrvzIMWYpJB5VLloo9f51loYXSkKxJIOztlNwIgLLSvEl0Dmp5vtj2buZ2nXQ2RBKxiLbc5eYGeMeoUnjk='

const variants = {
  development: {
    bundle: '.dev',
    name: ' (Dev)',
    trustedCertificates: [animoFunkeRelyingPartyCertificate, bdrPidIssuerCertificate],
  },
  preview: {
    bundle: '.preview',
    name: ' (Preview)',
    trustedCertificates: [animoFunkeRelyingPartyCertificate, bdrPidIssuerCertificate],
  },
  production: {
    bundle: '',
    name: '',
    trustedCertificates: [animoFunkeRelyingPartyCertificate, bdrPidIssuerCertificate],
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
      projectId: 'b5f457fa-bcab-4c6e-8092-8cdf1239027a',
    },
    trustedCertificates: variant.trustedCertificates,
  },
}

export default config
