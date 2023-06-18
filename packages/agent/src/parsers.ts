import type { AppAgent } from './agent'
import type {
  JwkDidCreateOptions,
  KeyDidCreateOptions,
  W3cCredentialRecord,
} from '@aries-framework/core'
import type {
  PresentationSubmission,
  VerifiedAuthorizationRequestWithPresentationDefinition,
} from '@internal/openid4vc-client'

import { DidJwk, DidKey, JwaSignatureAlgorithm } from '@aries-framework/core'
import { OpenIdCredentialFormatProfile, OpenId4VpClientService } from '@internal/openid4vc-client'
import { getHostNameFromUrl } from '@internal/utils'

export enum QrTypes {
  OPENID_INITIATE_ISSUANCE = 'openid-initiate-issuance://',
  OPENID_CREDENTIAL_OFFER = 'openid-credential-offer://',
  OPENID = 'openid://',
  OPENID_VC = 'openid-vc://',
}

export const isOpenIdCredentialOffer = (url: string) => {
  return (
    url.startsWith(QrTypes.OPENID_INITIATE_ISSUANCE) ||
    url.startsWith(QrTypes.OPENID_CREDENTIAL_OFFER)
  )
}

export const isOpenIdPresentationRequest = (url: string) => {
  return url.startsWith(QrTypes.OPENID) || url.startsWith(QrTypes.OPENID_VC)
}

export const receiveCredentialFromOpenId4VciOffer = async ({
  agent,
  data,
}: {
  agent: AppAgent
  data: string
}) => {
  if (!isOpenIdCredentialOffer(data))
    throw new Error('URI does not start with OpenID issuance prefix.')

  const records = await agent.modules.openId4VcClient.requestCredentialUsingPreAuthorizedCode({
    uri: data,
    proofOfPossessionVerificationMethodResolver: async ({
      supportedDidMethods,
      keyType,
      supportsAllDidMethods,
    }) => {
      // Prefer did:jwk, otherwise use did:key, otherwise use undefined
      const didMethod =
        supportsAllDidMethods || supportedDidMethods.includes('did:jwk')
          ? 'jwk'
          : supportedDidMethods.includes('did:key')
          ? 'key'
          : undefined

      if (!didMethod) {
        throw new Error(
          `No supported did method could be found. Supported methods are did:key and did:jwk. Issuer supports ${supportedDidMethods.join(
            ', '
          )}`
        )
      }

      const didResult = await agent.dids.create<JwkDidCreateOptions | KeyDidCreateOptions>({
        method: didMethod,
        options: {
          keyType,
        },
      })

      if (didResult.didState.state !== 'finished') {
        throw new Error('DID creation failed.')
      }

      let verificationMethodId: string
      if (didMethod === 'jwk') {
        const didJwk = DidJwk.fromDid(didResult.didState.did)
        verificationMethodId = didJwk.verificationMethodId
      } else {
        const didKey = DidKey.fromDid(didResult.didState.did)
        verificationMethodId = `${didKey.did}#${didKey.key.fingerprint}`
      }

      return didResult.didState.didDocument.dereferenceKey(verificationMethodId)
    },
    verifyCredentialStatus: false,
    allowedCredentialFormats: [OpenIdCredentialFormatProfile.JwtVcJson],
    allowedProofOfPossessionSignatureAlgorithms: [
      JwaSignatureAlgorithm.EdDSA,
      JwaSignatureAlgorithm.ES256,
    ],
  })

  if (!records || !records.length)
    throw new Error('Error storing credential using pre authorized flow.')

  return records[0]
}

export const getCredentialsForProofRequest = async ({
  data,
  agent,
}: {
  data: string
  agent: AppAgent
}) => {
  if (!isOpenIdPresentationRequest(data)) throw new Error('URI does not start with OpenID prefix.')

  const openId4VpClientService = agent.dependencyManager.resolve(OpenId4VpClientService)
  const results = await openId4VpClientService.selectCredentialForProofRequest(agent.context, {
    authorizationRequest: data,
  })

  return {
    ...results,
    verifierHostName: getHostNameFromUrl(results.verifiedAuthorizationRequest.redirectURI),
  }
}

export const shareProof = async ({
  agent,
  verifiedAuthorizationRequest,
  selectResults,
}: {
  agent: AppAgent
  verifiedAuthorizationRequest: VerifiedAuthorizationRequestWithPresentationDefinition
  selectResults: PresentationSubmission
}) => {
  const openId4VpClientService = agent.dependencyManager.resolve(OpenId4VpClientService)

  if (!selectResults.areRequirementsSatisfied) {
    throw new Error('Requirements are not satisfied.')
  }

  const credentialRecords = selectResults.requirements
    .flatMap((requirement) =>
      requirement.submission.flatMap((submission) => submission.verifiableCredential)
    )
    .filter(
      (credentialRecord): credentialRecord is W3cCredentialRecord => credentialRecord !== undefined
    )

  const credentials = credentialRecords.map((credentialRecord) => credentialRecord.credential)

  await openId4VpClientService.shareProof(agent.context, {
    verifiedAuthorizationRequest,
    selectedCredentials: credentials,
  })
}
