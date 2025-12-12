import { TypedArrayEncoder } from '@credo-ts/core'
import { Argon2, Argon2Algorithm, Argon2Version } from '@openwallet-foundation/askar-react-native'

/**
 * Derive a hash from pin and salt. (which can be used to seed a key)
 *
 * Configuration based on recommended parameters defined in RFC 9106
 * @see https://www.rfc-editor.org/rfc/rfc9106.html#name-parameter-choice
 *
 * returns a hex-encoded derived hash
 *
 */
const derive = (pin: string, salt: string): string => {
  const rawHash = Argon2.derivePassword(
    {
      algorithm: Argon2Algorithm.Argon2id,
      version: Argon2Version.V0x13,
      parallelism: 4,
      memCost: 64 * 1024,
      timeCost: 8,
    },
    TypedArrayEncoder.fromString(pin),
    TypedArrayEncoder.fromString(salt)
  )

  return TypedArrayEncoder.toUtf8String(rawHash)
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
