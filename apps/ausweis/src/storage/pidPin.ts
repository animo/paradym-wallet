import { generateKeypair, getPublicBytesForKeyId, sign } from '@animo-id/expo-secure-environment'
import { AUSWEIS_WALLET_PID_PIN_KEY_ID } from '@ausweis/constants'
import { Key, KeyAlgs } from '@hyperledger/aries-askar-react-native'

export const deviceKeyPair = {
  generate: () => generateKeypair(AUSWEIS_WALLET_PID_PIN_KEY_ID, true),
  sign: async (message: Uint8Array) => sign(AUSWEIS_WALLET_PID_PIN_KEY_ID, message, true),
  publicKey: () => getPublicBytesForKeyId(AUSWEIS_WALLET_PID_PIN_KEY_ID),
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
