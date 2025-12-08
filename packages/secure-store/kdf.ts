import { TypedArrayEncoder } from '@credo-ts/core'
import { askar } from '@openwallet-foundation/askar-react-native'

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
  // Takes about 1.5 second on iPhone 14 Pro
  // Need to test on Android/different devices as well
  // const { rawHash } = await argon2(pin, salt, {
  //   hashLength: 32,
  //   mode: 'argon2id',
  //   parallelism: 4,
  //   iterations: 8,
  //   memory: 64 * 1024,
  // })

  // FIXME: these parameters don't match with the parameters exposed by askar
  // thus it will not create the same result
  const rawHash = askar.argon2DerivePassword({
    parameters: 1,
    password: TypedArrayEncoder.fromString(pin),
    salt: TypedArrayEncoder.fromString(salt),
  })

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
