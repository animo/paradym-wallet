export class BiometricAuthenticationError extends Error {
  public static tryParseFromError(error: unknown): BiometricAuthenticationError | null {
    if (BiometricAuthenticationCancelledError.isBiometricAuthenticationCancelledError(error)) {
      return new BiometricAuthenticationCancelledError()
    }

    if (BiometricAuthenticationNotEnabledError.isBiometricAuthenticationNotEnabledError(error)) {
      return new BiometricAuthenticationNotEnabledError()
    }

    return null
  }
}

const androidErrorCodes = (codes: number[]) => codes.map((code) => `code: ${code},`)

const cancelMessages = [
  // From @animo-id/expo-secure-environment
  'authentication canceled',

  // From react-native-keychain
  // https://github.com/oblador/react-native-keychain/issues/609
  // iOS
  'user canceled the operation',

  // Android
  // These error codes probably means the user cancelled
  // https://developer.android.com/reference/androidx/biometric/BiometricPrompt#constants_1
  ...androidErrorCodes([10, 13, -1, 16, 3, 2, 8]),
]

export class BiometricAuthenticationCancelledError extends BiometricAuthenticationError {
  public static isBiometricAuthenticationCancelledError(error: unknown) {
    return error instanceof Error && cancelMessages.some((m) => error.message.toLowerCase().includes(m))
  }
}

const notEnabledMessages = [
  // From @animo-id/expo-secure-environment
  'biometry is not available for this app',

  // From react-native-keychain
  // iOS
  'the user name or passphrase you entered is not correct.',

  // Android
  // These error codes probably means biometry is not enabled
  // https://developer.android.com/reference/androidx/biometric/BiometricPrompt#constants_1
  ...androidErrorCodes([12, 1, 7, 9, 11, 14, 4, 15]),
  // Happens when no fingerprints are configured
  'at least one biometric must be enrolled to create keys requiring user authentication for every use',
]

export class BiometricAuthenticationNotEnabledError extends BiometricAuthenticationError {
  public static isBiometricAuthenticationNotEnabledError(error: unknown) {
    return error instanceof Error && notEnabledMessages.some((m) => error.message.toLowerCase().includes(m))
  }
}
