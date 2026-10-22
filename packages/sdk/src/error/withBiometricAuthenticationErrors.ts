import { ParadymWalletBiometricAuthenticationError } from '../error'

/**
 * Rethrows a failed biometric prompt as the matching SDK error, and any other error as it is.
 *
 * A credential key in the secure environment prompts for biometrics both when it is created and when
 * it signs, so the SDK methods that can do either wrap their work in this.
 */
export async function withBiometricAuthenticationErrors<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise
  } catch (error) {
    throw ParadymWalletBiometricAuthenticationError.tryParseFromError(error) ?? error
  }
}
