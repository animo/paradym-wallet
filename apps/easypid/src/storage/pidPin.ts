import { generateKeypair, getPublicBytesForKeyId, sign } from '@animo-id/expo-secure-environment'
import { EASYPID_WALLET_PID_PIN_KEY_ID } from '@easypid/constants'
import { Key, KeyAlgs } from '@hyperledger/aries-askar-react-native'

export const deviceKeyPair = {
  generate: () => generateKeypair(EASYPID_WALLET_PID_PIN_KEY_ID, false),
  sign: async (message: Uint8Array) => sign(EASYPID_WALLET_PID_PIN_KEY_ID, message, false),
  publicKey: () => getPublicBytesForKeyId(EASYPID_WALLET_PID_PIN_KEY_ID),
  asJwkInBytes: () =>
    Key.fromPublicBytes({
      publicKey: deviceKeyPair.publicKey(),
      algorithm: KeyAlgs.EcSecp256r1,
    }).jwkPublic.toUint8Array(),
  asJwk: () =>
    Key.fromPublicBytes({
      publicKey: deviceKeyPair.publicKey(),
      algorithm: KeyAlgs.EcSecp256r1,
    }).jwkPublic,
}
