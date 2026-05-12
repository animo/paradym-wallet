import { TypedArrayEncoder, X509Certificate } from '@credo-ts/core'
import { fetchCredentialMetadata } from '@owf/eudi-sca'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'

export const jwtSignatureVerifier = (sdk: ParadymWalletSdk) => {
  return async (x5c: Array<string>, toBeVerified: string, signature: Uint8Array): Promise<void> => {
    // Use the first certificate in the chain (buffer number: 1)
    const leafCertificateEncoded = x5c[0]

    if (!leafCertificateEncoded) {
      throw new Error('No X.509 certificate provided in x5c header')
    }

    // Parse the certificate and get the public JWK
    const leafCertificate = X509Certificate.fromEncodedCertificate(leafCertificateEncoded)
    const publicJwk = leafCertificate.publicJwk

    const verifyResult = await sdk.agent.kms.verify({
      signature,
      key: { publicJwk: publicJwk.toJson() },
      data: TypedArrayEncoder.fromString(toBeVerified),
      algorithm: publicJwk.signatureAlgorithm,
    })

    if (!verifyResult.verified) {
      throw new Error('JWT signature verification failed')
    }
  }
}

export const resolveCredentialMetadataUri = async (sdk: ParadymWalletSdk, credentialMetadataUri: string) => {
  const credentialMetadata = await fetchCredentialMetadata(jwtSignatureVerifier(sdk), credentialMetadataUri)
  return credentialMetadata
}
