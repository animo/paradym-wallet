import type { MdocRecord, SdJwtVcRecord } from '@credo-ts/core'
import { pidSchemes } from '@easypid/constants'
import { dcApiRegisterOptions } from '@easypid/utils/dcApiRegisterOptions'
import {
  ParadymWalletBiometricAuthenticationError,
  receiveCredentialFromOpenId4VciOffer,
  setCredentialCategoryMetadata,
  setOpenId4VcCredentialMetadata,
  setRefreshCredentialMetadata,
  storeCredential,
} from '@paradym/wallet-sdk'
import { getShouldUseCloudHsm } from '../features/onboarding/useShouldUseCloudHsm'
import { C_PRIME_SD_JWT_MDOC_OFFER } from './bdrPidIssuerOffers'
import { bdrPidOpenId4VcMetadata, bdrPidSdJwtTypeMetadata } from './bdrPidMetadata'
import { ReceivePidUseCaseFlow, type ReceivePidUseCaseFlowOptions } from './ReceivePidUseCaseFlow'

export class ReceivePidUseCaseCFlow extends ReceivePidUseCaseFlow {
  // TODO(sdk): not tested
  public static async initialize(options: ReceivePidUseCaseFlowOptions) {
    const resolved = await options.paradym.openid4vc.resolveCredentialOffer({
      offerUri: C_PRIME_SD_JWT_MDOC_OFFER,
      authorization: {
        clientId: ReceivePidUseCaseCFlow.CLIENT_ID,
        redirectUri: ReceivePidUseCaseCFlow.REDIRECT_URI,
      },
    })

    // NOTE: the bdr pid issuer does not include in their metadata that they support batch while they do support is
    // and Credo checks for this. We modify the metadata so we can still use batch issuance
    if (!resolved.resolvedCredentialOffer.metadata.credentialIssuer.batch_credential_issuance) {
      resolved.resolvedCredentialOffer.metadata.credentialIssuer.batch_credential_issuance = {
        batch_size: 10,
      }
    }

    if (resolved.flow !== 'auth') {
      throw new Error('Expected authorization_code grant, but not found')
    }

    const authFlow = new ReceivePidUseCaseCFlow(
      options,
      resolved.resolvedAuthorizationRequest,
      resolved.resolvedCredentialOffer
    )
    // We handle the error differently
    authFlow.startAuthFlow().catch(() => {})
    const accessRights = await authFlow.accessRights
    authFlow.options.onStateChange?.('id-card-auth')
    return { authFlow, accessRights }
  }

  public async retrieveCredentials() {
    try {
      this.assertState({ expectedState: 'retrieve-credential' })

      if (!this.accessToken) {
        throw new Error('Expected accessToken be defined in state retrieve-credential')
      }

      const credentialConfigurationIdsToRequest = Object.keys(
        this.resolvedCredentialOffer.offeredCredentialConfigurations
      )

      // TODO(sdk): create sdk functionality
      const { credentials, deferredCredentials } = await receiveCredentialFromOpenId4VciOffer({
        paradym: this.options.paradym,
        accessToken: this.accessToken,
        resolvedCredentialOffer: this.resolvedCredentialOffer,
        credentialConfigurationIdsToRequest,
        clientId: ReceivePidUseCaseCFlow.CLIENT_ID,
        requestBatch: getShouldUseCloudHsm() ? 2 : false,
        pidSchemes,
      })

      if (deferredCredentials && deferredCredentials.length > 0) {
        throw new Error('Unexpected deferred credentials in refresh pid use case flow')
      }

      const credentialRecords: Array<SdJwtVcRecord | MdocRecord> = []
      for (const credentialResponse of credentials) {
        const credentialRecord = credentialResponse.credential

        if (credentialRecord.type !== 'SdJwtVcRecord' && credentialRecord.type !== 'MdocRecord') {
          throw new Error(`Unexpected record type ${credentialRecord.type}`)
        }

        // NOTE: temp override to use hardcoded type metadata.
        // it uses parts of our branding (as the type metadata doesn't contain
        // rendering and a very weird long name)
        if (credentialRecord.type === 'SdJwtVcRecord') {
          credentialRecord.typeMetadata = bdrPidSdJwtTypeMetadata
        }

        setCredentialCategoryMetadata(credentialRecord, {
          credentialCategory: 'DE-PID',
          // prioritize sd-jwt for PID
          displayPriority: credentialRecord.type === 'SdJwtVcRecord',
        })

        // Override openid4vc metadata
        setOpenId4VcCredentialMetadata(
          credentialRecord,
          bdrPidOpenId4VcMetadata(this.resolvedCredentialOffer.credentialOfferPayload.credential_issuer)
        )

        // It seems the refresh token can be re-used, so we store it on all the records
        if (this.accessToken.accessTokenResponse.refresh_token) {
          setRefreshCredentialMetadata(credentialRecord, {
            refreshToken: this.accessToken.accessTokenResponse.refresh_token,
            dpop: this.accessToken.dpop
              ? { alg: this.accessToken.dpop.alg, jwk: this.accessToken.dpop.jwk.toJson() }
              : undefined,
          })
        }

        credentialRecords.push(credentialRecord)
        await storeCredential(dcApiRegisterOptions({ paradym: this.options.paradym, credentialRecord }))
      }

      return credentialRecords
    } catch (error) {
      // We can recover from this error, so we shouldn't set the state to error
      if (error instanceof ParadymWalletBiometricAuthenticationError) {
        throw error
      }

      this.handleError(error)
      console.error('CAUSE: ', (error as Error).cause)
      throw error
    }
  }
}
