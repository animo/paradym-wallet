import type { MdocRecord } from '@credo-ts/core'
import { pidSchemes } from '@easypid/constants'
import {
  BiometricAuthenticationError,
  OpenId4VciAuthorizationFlow,
  type SdJwtVcRecord,
  receiveCredentialFromOpenId4VciOffer,
  resolveOpenId4VciOffer,
  storeCredential,
} from '@package/agent'
import { ReceivePidUseCaseFlow, type ReceivePidUseCaseFlowOptions } from './ReceivePidUseCaseFlow'
import { C_SD_JWT_MDOC_OFFER } from './bdrPidIssuerOffers'

export class ReceivePidUseCaseCFlow extends ReceivePidUseCaseFlow {
  public static async initialize(options: ReceivePidUseCaseFlowOptions) {
    const resolved = await resolveOpenId4VciOffer({
      agent: options.agent,
      offer: { uri: C_SD_JWT_MDOC_OFFER },
      authorization: {
        clientId: ReceivePidUseCaseCFlow.CLIENT_ID,
        redirectUri: ReceivePidUseCaseCFlow.REDIRECT_URI,
      },
    })

    if (
      !resolved.resolvedAuthorizationRequest ||
      resolved.resolvedAuthorizationRequest.authorizationFlow === OpenId4VciAuthorizationFlow.PresentationDuringIssuance
    ) {
      throw new Error('Expected authorization_code grant, but not found')
    }

    const authFlow = new ReceivePidUseCaseCFlow(
      options,
      resolved.resolvedAuthorizationRequest,
      resolved.resolvedCredentialOffer
    )
    authFlow.startAuthFlow()
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
      const credentialResponses = await receiveCredentialFromOpenId4VciOffer({
        agent: this.options.agent,
        accessToken: this.accessToken,
        resolvedCredentialOffer: this.resolvedCredentialOffer,
        credentialConfigurationIdsToRequest,
        clientId: ReceivePidUseCaseCFlow.CLIENT_ID,
        pidSchemes,
      })

      const credentialRecords: Array<SdJwtVcRecord | MdocRecord> = []
      for (const credentialResponse of credentialResponses) {
        const credentialRecord = credentialResponse.credential
        if (typeof credentialRecord === 'string') throw new Error('No string expected for c flow')
        if (credentialRecord.type !== 'SdJwtVcRecord' && credentialRecord.type !== 'MdocRecord') {
          throw new Error(`Unexpected record type ${credentialRecord.type}`)
        }

        credentialRecords.push(credentialRecord)
        await storeCredential(this.options.agent, credentialRecord)
      }

      return credentialRecords
    } catch (error) {
      // We can recover from this error, so we shouldn't set the state to error
      if (error instanceof BiometricAuthenticationError) {
        throw error
      }

      this.handleError(error)
      throw error
    }
  }
}
