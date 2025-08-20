import type { X509Certificate } from '@credo-ts/core'
import type { OpenId4VpResolvedAuthorizationRequest } from '@credo-ts/openid4vc'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { type GetTrustedEntitiesForDidOptions, getTrustedEntitiesForDid } from './handlers/did'
import {
  type GetTrustedEntitiesForEudiRpAuthenticationOptions,
  type TrustList,
  getTrustedEntitiesForEudiRpAuthentication,
} from './handlers/eudiRpAuthentication'
import {
  type GetTrustedEntitiesForOpenIdFederationOptions,
  getTrustedEntitiesForOpenIdFederation,
} from './handlers/openIdFederation'
import {
  type GetTrustedEntitiesForX509CertificateOptions,
  type TrustedX509Entity,
  getTrustedEntitiesForX509Certificate,
} from './handlers/x509'

export type TrustedEntity = {
  entityId: string
  organizationName: string
  logoUri?: string
  uri?: string
  demo?: boolean
}

export type TrustMechanism = 'eudi_rp_authentication' | 'openid_federation' | 'x509' | 'did'

export type EudiRpAuthenticationTrustMechanismConfiguration = {
  trustMechanism: 'eudi_rp_authentication'
  trustList: TrustList
  trustedX509Entities: TrustedX509Entity[]
}

export type OpenIdFederationTrustMechanismConfiguration = {
  trustMechanism: 'openid_federation'
  trustedEntityIds: string[]
}

export type X509TrustMechanismConfiguration = {
  trustMechanism: 'x509'
  trustedX509Entities: TrustedX509Entity[]
}

export type DidTrustMechanismConfiguration = {
  trustMechanism: 'did'
}

export type TrustMechanismConfiguration =
  | EudiRpAuthenticationTrustMechanismConfiguration
  | OpenIdFederationTrustMechanismConfiguration
  | X509TrustMechanismConfiguration
  | DidTrustMechanismConfiguration

export type AuthorizationRequestVerificationResult = {
  isValidButUntrusted: boolean
  isValidAndTrusted: boolean
  x509RegistrationCertificate: X509Certificate
}[]

export type GetTrustedEntitiesOptions = Omit<
  { paradym: ParadymWalletSdk } & GetTrustedEntitiesForEudiRpAuthenticationOptions &
    GetTrustedEntitiesForOpenIdFederationOptions &
    GetTrustedEntitiesForDidOptions &
    GetTrustedEntitiesForX509CertificateOptions,
  'trustMechanismConfiguration'
>

export const detectTrustMechanism = (options: {
  resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest
  authorizationRequestVerificationResult?: AuthorizationRequestVerificationResult
}): TrustMechanism => {
  if (options.authorizationRequestVerificationResult && options.authorizationRequestVerificationResult.length > 0) {
    return 'eudi_rp_authentication'
  }

  if (options.resolvedAuthorizationRequest.verifier.clientIdScheme === 'https') {
    return 'openid_federation'
  }

  if (options.resolvedAuthorizationRequest.signedAuthorizationRequest?.signer.method === 'x5c') {
    return 'x509'
  }

  if (options.resolvedAuthorizationRequest.verifier.clientIdScheme === 'did') {
    return 'did'
  }

  throw new Error('Could not infer trust mechanism for authorization request')
}

export const getTrustedEntities = async (
  options: GetTrustedEntitiesOptions
): Promise<{
  trustMechanism: TrustMechanism
  relyingParty: { logoUri?: string; uri?: string; organizationName?: string; entityId: string }
  trustedEntities: Array<TrustedEntity>
}> => {
  const trustMechanism = detectTrustMechanism(options)

  const trustMechanismConfiguration = options.paradym.trustMechanisms.find((tm) => tm.trustMechanism === trustMechanism)

  // TODO(sdk): what do we want to do when a trust mechanism is used, but not configured? Ignore or error?
  if (!trustMechanismConfiguration) {
    throw new Error(`Found '${trustMechanism}', but without any configuration`)
  }

  // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
  let trustedEntities
  switch (trustMechanism) {
    case 'eudi_rp_authentication':
      trustedEntities = await getTrustedEntitiesForEudiRpAuthentication({
        ...options,
        trustMechanismConfiguration: trustMechanismConfiguration as EudiRpAuthenticationTrustMechanismConfiguration,
      })
      break
    case 'openid_federation':
      trustedEntities = await getTrustedEntitiesForOpenIdFederation({
        ...options,
        trustMechanismConfiguration: trustMechanismConfiguration as OpenIdFederationTrustMechanismConfiguration,
      })
      break
    case 'x509':
      trustedEntities = await getTrustedEntitiesForX509Certificate({
        ...options,
        trustMechanismConfiguration: trustMechanismConfiguration as X509TrustMechanismConfiguration,
      })
      break
    case 'did':
      trustedEntities = await getTrustedEntitiesForDid(options)
      break
    default:
      throw new Error(`Could not handle trust mechanism: '${trustMechanism}'`)
  }

  let entityId = trustedEntities.relyingParty.entityId
  if (!entityId) {
    if (options.origin) entityId = `web-origin:${options.origin}`
    throw new Error('Missing required client_id in authorization request')
  }

  return {
    ...trustedEntities,
    trustMechanism,
    relyingParty: {
      ...trustedEntities.relyingParty,
      entityId,
    },
  }
}
