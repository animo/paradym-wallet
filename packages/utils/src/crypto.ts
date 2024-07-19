import { Key, KeyAlgs, KeyMethod } from "@hyperledger/aries-askar-react-native";
import argon2, { Argon2Config } from "react-native-argon2";
import { Buffer } from "buffer";

/**
 * Derive key from pin and salt.
 *
 * Configuration based on recommended parameters defined in RFC 9106
 * @see https://www.rfc-editor.org/rfc/rfc9106.html#name-parameter-choice
 */
export const argon2idConfiguration: Argon2Config = {
  hashLength: 32,
  mode: "argon2id",
  parallelism: 4,
  iterations: 1,
  memory: 21,
};

/**
 *
 * Derive a key pair based on a numeric pin according to the steps in B'
 *
 */
export const deriveKeyPairFromPin = async (pin: Array<number>) => {
  // Generate a random AES key
  const pinSalt = Key.generate(KeyAlgs.AesA128Gcm);

  // TODO: the specification mentions nothing of the nonce or aad
  //       can the nonce just be random and it will work?
  //       I assume it would, as it is just a KDF
  const pinSecret = pinSalt.aeadEncrypt({ message: new Uint8Array(pin) });

  // use a KDF to derive a key to be used as a seed for the key pair
  //
  // TODO: does it matter that we use argon2 here?
  const { rawHash: pinSeed } = await argon2(
    pin.join(""),
    Buffer.from(pinSecret.ciphertext).toString(),
    argon2idConfiguration
  );

  // Generate a key pair based on the KDF seed
  const keypair = Key.fromSeed({
    seed: new Uint8Array(Buffer.from(pinSeed)),
    method: KeyMethod.None,
    algorithm: KeyAlgs.EcSecp256r1,
  });

  return keypair;
};
