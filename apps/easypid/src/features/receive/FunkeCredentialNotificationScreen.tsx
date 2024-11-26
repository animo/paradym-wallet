import {
  BiometricAuthenticationCancelledError,
  type CredentialsForProofRequest,
  type MdocRecord,
  OpenId4VciAuthorizationFlow,
  type OpenId4VciRequestTokenResponse,
  type OpenId4VciResolvedAuthorizationRequest,
  type OpenId4VciResolvedCredentialOffer,
  type SdJwtVcRecord,
  type W3cCredentialRecord,
  acquireAuthorizationCodeAccessToken,
  acquireAuthorizationCodeUsingPresentation,
  acquirePreAuthorizedAccessToken,
  extractOpenId4VcCredentialMetadata,
  getCredentialDisplayWithDefaults,
  getCredentialForDisplay,
  getCredentialForDisplayId,
  getCredentialsForProofRequest,
  getOpenId4VcCredentialDisplay,
  receiveCredentialFromOpenId4VciOffer,
  resolveOpenId4VciOffer,
  shareProof,
  storeCredential,
} from '@package/agent'

import { useAppAgent } from '@easypid/agent'

import { InvalidPinError } from '@easypid/crypto/error'
import { SlideWizard, usePushToWallet } from '@package/app'
import { useToastController } from '@package/ui'
import { useCallback, useEffect, useState } from 'react'
import { createParam } from 'solito'
import { setWalletServiceProviderPin } from '../../crypto/WalletServiceProviderClient'
import { useShouldUsePinForSubmission } from '../../hooks/useShouldUsePinForPresentation'
import { addReceivedActivity, useActivities } from '../activity/activityRecord'
import type { PresentationRequestResult } from '../share/components/utils'
import { PinSlide } from '../share/slides/PinSlide'
import { ShareCredentialsSlide } from '../share/slides/ShareCredentialsSlide'
import { AuthCodeFlowSlide } from './slides/AuthCodeFlowSlide'
import { CredentialCardSlide } from './slides/CredentialCardSlide'
import { CredentialErrorSlide } from './slides/CredentialErrorSlide'
import { CredentialRetrievalSlide } from './slides/CredentialRetrievalSlide'
import { LoadingRequestSlide } from './slides/LoadingRequestSlide'
import { TxCodeSlide } from './slides/TxCodeSlide'
import { VerifyPartySlide } from './slides/VerifyPartySlide'

type Query = { uri?: string; data?: string }

// TODO: clientId
const authorization = {
  clientId: 'wallet',
  redirectUri: 'id.animo.ausweis:///wallet/redirect',
}

const { useParams } = createParam<Query>()

export function FunkeCredentialNotificationScreen() {
  const { agent } = useAppAgent()
  const { params } = useParams()
  const toast = useToastController()

  const pushToWallet = usePushToWallet()

  const [errorReason, setErrorReason] = useState<string>()
  const [isCompleted, setIsCompleted] = useState(false)

  const [resolvedCredentialOffer, setResolvedCredentialOffer] = useState<OpenId4VciResolvedCredentialOffer>()
  const [resolvedAuthorizationRequest, setResolvedAuthorizationRequest] =
    useState<OpenId4VciResolvedAuthorizationRequest>()

  const [isSharingPresentation, setIsSharingPresentation] = useState(false)
  const [credentialsForRequest, setCredentialsForRequest] = useState<CredentialsForProofRequest>()
  const [credentialAttributes, setCredentialAttributes] = useState<Record<string, unknown>>()
  const [receivedRecord, setReceivedRecord] = useState<SdJwtVcRecord | MdocRecord | W3cCredentialRecord>()

  // TODO: where to transform?
  // Combine oid4vci issuer metadata and openid fed into one pipeline. If openid it's trusted
  const issuerMetadata = resolvedCredentialOffer?.metadata.credentialIssuer
  // We want the first supported configuration id
  // TODO: handle empty configuration ids
  const configurationId = resolvedCredentialOffer?.offeredCredentialConfigurations
    ? Object.keys(resolvedCredentialOffer.offeredCredentialConfigurations)[0]
    : undefined
  const configuration = configurationId
    ? resolvedCredentialOffer?.offeredCredentialConfigurations[configurationId]
    : undefined

  const credentialDisplay = getCredentialDisplayWithDefaults(
    configuration && issuerMetadata
      ? getOpenId4VcCredentialDisplay(
          extractOpenId4VcCredentialMetadata(configuration, {
            display: issuerMetadata?.display,
            id: issuerMetadata?.credential_issuer,
          })
        )
      : {}
  )

  const shouldUsePinForPresentation = useShouldUsePinForSubmission(credentialsForRequest)
  const preAuthGrant =
    resolvedCredentialOffer?.credentialOfferPayload.grants?.['urn:ietf:params:oauth:grant-type:pre-authorized_code']
  const txCode = preAuthGrant?.tx_code
  const { activities } = useActivities({ filters: { entityId: issuerMetadata?.credential_issuer } })

  // TODO: fed metadata should be returned by get crednetial offer method from agent package
  // TODO: add issuer metadata
  // const issuerMetadata = useMemo(
  //   () => getOpenIdFedIssuerMetadata(authCodeFlowDetails?.domain as string),
  //   [authCodeFlowDetails?.domain]
  // )

  useEffect(() => {
    resolveOpenId4VciOffer({ agent, offer: params, authorization })
      .then(({ resolvedAuthorizationRequest, resolvedCredentialOffer }) => {
        setResolvedCredentialOffer(resolvedCredentialOffer)
        setResolvedAuthorizationRequest(resolvedAuthorizationRequest)
      })
      .catch((error) => {
        agent.config.logger.error(`Couldn't resolve OpenID4VCI offer`, {
          error,
        })
        setErrorReason('Credential information could not be extracted')
      })
  }, [params, agent])

  const retrieveCredentials = useCallback(
    async (
      resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer,
      tokenResponse: OpenId4VciRequestTokenResponse,
      configurationId: string,
      resolvedAuthorizationRequest?: OpenId4VciResolvedAuthorizationRequest
    ) => {
      const credentialResponses = await receiveCredentialFromOpenId4VciOffer({
        agent,
        resolvedCredentialOffer,
        credentialConfigurationIdsToRequest: [configurationId],
        accessToken: tokenResponse,
        clientId: resolvedAuthorizationRequest ? authorization.clientId : undefined,
        // Always request batch for non pid credentials
        requestBatch: true,
      })

      const credentialRecord = credentialResponses[0].credential
      const { attributes } = getCredentialForDisplay(credentialRecord)
      setCredentialAttributes(attributes)
      setReceivedRecord(credentialRecord)
    },
    [agent]
  )

  // TODO: Should we add this to the activitiy? We also don't do it for issuance
  const onProofDecline = async () => {
    toast.show('Information request has been declined.', { customData: { preset: 'danger' } })
    pushToWallet('back')
  }

  const onCompleteCredentialRetrieval = async () => {
    if (!receivedRecord) return

    await storeCredential(agent, receivedRecord)
    await addReceivedActivity(agent, {
      // TODO: should host be entityId or the iss?
      entityId: resolvedCredentialOffer?.metadata.credentialIssuer.credential_issuer as string,
      host: credentialDisplay.issuer.domain,
      name: credentialDisplay.issuer.name,
      logo: credentialDisplay.issuer.logo,
      backgroundColor: '#ffffff', // Default to a white background for now
      credentialIds: [getCredentialForDisplayId(receivedRecord)],
    })

    setIsCompleted(true)
  }

  const acquireCredentialsAuth = useCallback(
    async (authorizationCode: string) => {
      if (!resolvedCredentialOffer || !resolvedAuthorizationRequest || !configurationId) {
        setErrorReason('Credential information could not be extracted')
        return
      }
      try {
        const tokenResponse = await acquireAuthorizationCodeAccessToken({
          agent,
          resolvedCredentialOffer,
          redirectUri: authorization.redirectUri,
          authorizationCode,
          clientId: authorization.clientId,
          codeVerifier:
            'codeVerifier' in resolvedAuthorizationRequest ? resolvedAuthorizationRequest.codeVerifier : undefined,
        })

        await retrieveCredentials(resolvedCredentialOffer, tokenResponse, configurationId, resolvedAuthorizationRequest)
      } catch (error) {
        agent.config.logger.error(`Couldn't receive credential from OpenID4VCI offer`, {
          error,
        })
        setErrorReason('Error while retrieving credentials')
      }
    },
    [resolvedCredentialOffer, resolvedAuthorizationRequest, retrieveCredentials, agent, configurationId]
  )

  const acquireCredentialsPreAuth = useCallback(
    async (txCode?: string) => {
      if (!resolvedCredentialOffer || !configurationId) {
        setErrorReason('Credential information could not be extracted')
        return
      }

      try {
        const tokenResponse = await acquirePreAuthorizedAccessToken({
          agent,
          resolvedCredentialOffer,
          txCode,
        })
        await retrieveCredentials(resolvedCredentialOffer, tokenResponse, configurationId)
      } catch (error) {
        agent.config.logger.error(`Couldn't receive credential from OpenID4VCI offer`, {
          error,
        })
        setErrorReason('Error while retrieving credentials')
      }
    },
    [resolvedCredentialOffer, agent, retrieveCredentials, configurationId]
  )

  const parsePresentationRequestUrl = useCallback(
    (oid4vpRequestUrl: string) =>
      getCredentialsForProofRequest({
        agent,
        uri: oid4vpRequestUrl,
      })
        .then(setCredentialsForRequest)
        .catch((error) => {
          setErrorReason('Presentation information could not be extracted.')
          agent.config.logger.error('Error getting credentials for request', {
            error,
          })
        }),
    [agent]
  )

  const onCheckCardContinue = useCallback(async () => {
    if (preAuthGrant && !preAuthGrant.tx_code) {
      await acquireCredentialsPreAuth()
    }
    if (resolvedAuthorizationRequest?.authorizationFlow === OpenId4VciAuthorizationFlow.PresentationDuringIssuance) {
      await parsePresentationRequestUrl(resolvedAuthorizationRequest.oid4vpRequestUrl)
    }
  }, [acquireCredentialsPreAuth, parsePresentationRequestUrl, preAuthGrant, resolvedAuthorizationRequest])

  const onSubmitTxCode = useCallback(
    async (txCode: string) => {
      await acquireCredentialsPreAuth(txCode)
    },
    [acquireCredentialsPreAuth]
  )

  const onPresentationAccept: (pin?: string) => Promise<undefined | PresentationRequestResult> = useCallback(
    async (pin?: string) => {
      if (
        !credentialsForRequest ||
        !resolvedCredentialOffer ||
        !resolvedAuthorizationRequest ||
        resolvedAuthorizationRequest.authorizationFlow !== OpenId4VciAuthorizationFlow.PresentationDuringIssuance
      ) {
        setErrorReason('Presentation information could not be extracted.')
        return
      }

      setIsSharingPresentation(true)

      if (shouldUsePinForPresentation) {
        // TODO: we should handle invalid pin
        if (!pin) {
          setErrorReason('Presentation information could not be extracted.')
          return
        }
        // TODO: maybe provide to shareProof method?
        try {
          await setWalletServiceProviderPin(pin.split('').map(Number))
        } catch (e) {
          if (e instanceof InvalidPinError) {
            toast.show(e.message, { customData: { preset: 'danger' } })
            setIsSharingPresentation(false)
            return { status: 'error', result: { title: e.message }, redirectToWallet: false }
          }

          setErrorReason('Presentation information could not be extracted.')
          return
        }
      }

      try {
        const { presentationDuringIssuanceSession } = await shareProof({
          agent,
          resolvedRequest: credentialsForRequest,
          selectedCredentials: {},
        })

        const { authorizationCode } = await acquireAuthorizationCodeUsingPresentation({
          resolvedCredentialOffer,
          authSession: resolvedAuthorizationRequest.authSession,
          presentationDuringIssuanceSession,
          agent,
        })

        await acquireCredentialsAuth(authorizationCode)

        setIsSharingPresentation(false)
      } catch (error) {
        setIsSharingPresentation(false)
        if (error instanceof BiometricAuthenticationCancelledError) {
          setErrorReason('Biometric authentication cancelled')
          return
        }

        agent.config.logger.error('Error accepting presentation', {
          error,
        })
        setErrorReason('Presentation could not be shared.')
      }
    },
    [
      credentialsForRequest,
      agent,
      acquireCredentialsAuth,
      resolvedAuthorizationRequest,
      resolvedCredentialOffer,
      shouldUsePinForPresentation,
      toast.show,
    ]
  )

  const onCancel = () => pushToWallet('back')
  const onGoToWallet = () => pushToWallet('replace')

  const isAuthFlow =
    resolvedAuthorizationRequest?.authorizationFlow === OpenId4VciAuthorizationFlow.PresentationDuringIssuance &&
    credentialsForRequest

  const isPreAuthWithTxFlow = preAuthGrant && txCode

  const isBrowserAuthFlow =
    resolvedCredentialOffer &&
    resolvedAuthorizationRequest?.authorizationFlow === OpenId4VciAuthorizationFlow.Oauth2Redirect

  return (
    <SlideWizard
      steps={[
        {
          step: 'loading-request',
          progress: 16.5,
          screen: (
            <LoadingRequestSlide key="loading-request" isLoading={!resolvedCredentialOffer} isError={!!errorReason} />
          ),
        },
        {
          step: 'verify-issuer',
          progress: 33,
          backIsCancel: true,
          screen: (
            <VerifyPartySlide
              key="verify-issuer"
              type="offer"
              name={credentialDisplay.issuer.name}
              logo={credentialDisplay.issuer.logo}
              entityId={issuerMetadata?.credential_issuer as string}
              lastInteractionDate={activities[0]?.date}
              onContinue={onCheckCardContinue}
            />
          ),
        },
        isBrowserAuthFlow
          ? {
              step: 'auth-code-flow',
              progress: 49.5,
              backIsCancel: true,
              screen: (
                <AuthCodeFlowSlide
                  key="auth-code-flow"
                  display={credentialDisplay}
                  authCodeFlowDetails={{
                    openUrl: resolvedAuthorizationRequest.authorizationRequestUrl,
                    redirectUri: authorization.redirectUri,
                    domain: resolvedCredentialOffer.metadata.credentialIssuer.credential_issuer,
                  }}
                  onAuthFlowCallback={acquireCredentialsAuth}
                  onCancel={() => {
                    setErrorReason('Authorization cancelled')
                  }}
                  onError={() => {
                    setErrorReason('Authorization failed')
                  }}
                />
              ),
            }
          : {
              step: 'check-card',
              progress: 49.5,
              screen: (
                <CredentialCardSlide
                  key="credential-card"
                  type={isAuthFlow ? 'presentation' : isPreAuthWithTxFlow ? 'pin' : 'noAuth'}
                  display={credentialDisplay}
                />
              ),
            },
        // TODO: verify entity slide??
        isAuthFlow
          ? {
              step: 'presentation-during-issuance',
              progress: 66,
              backIsCancel: true,
              screen: (
                <ShareCredentialsSlide
                  key="share-credentials"
                  onAccept={shouldUsePinForPresentation ? undefined : onPresentationAccept}
                  onDecline={onProofDecline}
                  logo={credentialsForRequest.verifier.logo}
                  submission={credentialsForRequest.formattedSubmission}
                  isAccepting={isSharingPresentation}
                />
              ),
            }
          : undefined,
        isAuthFlow && shouldUsePinForPresentation
          ? {
              step: 'pin-enter',
              progress: 82.5,
              screen: (
                <PinSlide key="pin-enter" isLoading={isSharingPresentation} onPinComplete={onPresentationAccept} />
              ),
            }
          : undefined,
        isPreAuthWithTxFlow
          ? {
              step: 'tx-code',
              progress: 66,
              backIsCancel: true,
              screen: <TxCodeSlide txCode={txCode} onTxCode={onSubmitTxCode} />,
            }
          : undefined,

        {
          step: 'retrieve-credential',
          progress: 82.5,
          backIsCancel: true,
          screen: (
            <CredentialRetrievalSlide
              key="retrieve-credential"
              onGoToWallet={onGoToWallet}
              display={credentialDisplay}
              attributes={credentialAttributes ?? {}}
              isCompleted={isCompleted}
              onAccept={onCompleteCredentialRetrieval}
            />
          ),
        },
      ].filter((v): v is Exclude<typeof v, undefined> => v !== undefined)}
      errorScreen={() => <CredentialErrorSlide key="credential-error" reason={errorReason} onCancel={onCancel} />}
      isError={errorReason !== undefined}
      onCancel={onCancel}
    />
  )
}
