import argon2 from 'react-native-argon2'

/**
 * Derive key from pin and salt.
 *
 * Configuration based on recommended parameters defined in RFC 9106
 * @see https://www.rfc-editor.org/rfc/rfc9106.html#name-parameter-choice
 */
export const deriveWalletKey = async (pin: string, salt: string) => {
  const { rawHash } = await argon2(pin, salt, {
    hashLength: 32,
    mode: 'argon2id',
    parallelism: 4,
    iterations: 1,
    memory: 21,
  })

  return rawHash
}

/**
 * Generate 32 byte key crypto getRandomValues.
 *
 * @see https://github.com/LinusU/react-native-get-random-values
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
 */
export function generateSalt(): string {
  return crypto.getRandomValues(new Uint8Array(32)).join('')
}
