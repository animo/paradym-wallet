import argon2 from 'react-native-argon2'

/**
 * Derive a hash from pin and salt. (which can be used to seed a key)
 *
 * Configuration based on recommended parameters defined in RFC 9106
 * @see https://www.rfc-editor.org/rfc/rfc9106.html#name-parameter-choice
 *
 * returns a hex-encoded derived hash
 *
 */
const derive = async (pin: string, salt: string): Promise<string> => {
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
const generateSalt = () => crypto.getRandomValues(new Uint8Array(32)).join('')

/**
 * Derive key from pin and salt.
 *
 * Configuration based on recommended parameters defined in RFC 9106
 * @see https://www.rfc-editor.org/rfc/rfc9106.html#name-parameter-choice
 */
export const kdf = { derive, generateSalt }
