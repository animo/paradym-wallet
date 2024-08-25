import {
  BiometricAuthenticationCancelledError,
  formatDifPexCredentialsForRequest,
  getCredentialsForProofRequest,
  shareProof,
  useAgent,
} from '@package/agent'
import { useToastController } from '@package/ui'
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter, useGlobalSearchParams, useLocalSearchParams } from 'expo-router'

import { PidIssuerPinInvalidError, requestSdJwtVcFromSeedCredential } from '@easypid/crypto/bPrime'
import { useSeedCredentialPidData } from '@easypid/storage'
import { GettingInformationScreen } from '@package/app/src/features/notifications/components/GettingInformationScreen'
import { FunkePresentationNotificationScreen } from './FunkePresentationNotificationScreen'
import { ClaimFormat } from '@credo-ts/core'

type Query = { uri?: string; data?: string }

export function FunkeOpenIdPresentationNotificationScreen() {
  const { agent } = useAgent()
  const router = useRouter()
  const toast = useToastController()
  const { pin } = useGlobalSearchParams<{ pin?: string }>()
  const params = useLocalSearchParams<Query>()
  const { seedCredential } = useSeedCredentialPidData()
  // TODO: update to useAcceptOpenIdPresentation
  const [credentialsForRequest, setCredentialsForRequest] =
    useState<Awaited<ReturnType<typeof getCredentialsForProofRequest>>>()
  const [isSharing, setIsSharing] = useState(false)

  const submission = useMemo(
    () =>
      credentialsForRequest
        ? formatDifPexCredentialsForRequest(credentialsForRequest.credentialsForRequest)
        : undefined,
    [credentialsForRequest]
  )

  const pushToWallet = useCallback(() => {
    router.back()

    // If we do a PIN confirmation we need to go back twice
    if (router.canGoBack()) router.back()
  }, [router.back, router.canGoBack])

  useEffect(() => {
    if (credentialsForRequest) return

    getCredentialsForProofRequest({
      agent,
      data: params.data,
      uri: params.uri,
    })
      .then(setCredentialsForRequest)
      .catch((error) => {
        toast.show('Presentation information could not be extracted.', {
          customData: { preset: 'danger' },
        })
        agent.config.logger.error('Error getting credentials for request', {
          error,
        })

        pushToWallet()
      })
  }, [credentialsForRequest, params.data, params.uri, toast.show, agent, pushToWallet, toast])

  const seedGetPin = () => {
    router.push('/pinConfirmation')
  }

  const onProofAccept = useCallback(async () => {
    if (!submission || !credentialsForRequest) return

    setIsSharing(true)

    try {
      await shareProof({
        agent,
        authorizationRequest: credentialsForRequest.authorizationRequest,
        credentialsForRequest: credentialsForRequest.credentialsForRequest,
        selectedCredentials: {},
      })

      toast.show('Information has been successfully shared.', {
        customData: { preset: 'success' },
      })
      pushToWallet()
    } catch (error) {
      if (error instanceof BiometricAuthenticationCancelledError) {
        toast.show('Biometric authentication cancelled', {
          customData: { preset: 'danger' },
        })
        setIsSharing(false)
        return
      }

      toast.show('Presentation could not be shared.', {
        customData: { preset: 'danger' },
      })
      agent.config.logger.error('Error accepting presentation', {
        error,
      })
      pushToWallet()
    }
  }, [submission, credentialsForRequest, agent, pushToWallet, toast.show])

  useEffect(() => {
    if (!pin) return

    requestSdJwtVcFromSeedCredential({
      agent,
      authorizationRequestUri: params.uri ?? 'TODO: this is temp anyways',
      pidPin: pin,
      incorrectPin: false,
    })
      .then((sdJwtVc) => {
        // We add the newly retrieved SD-JWT VC as the first credential in the credentials for request
        // So it will automatically be selected when creating the presentation
        const entry = credentialsForRequest?.credentialsForRequest.requirements[0].submissionEntry[0]
        entry?.verifiableCredentials.unshift({
          type: ClaimFormat.SdJwtVc,
          // FIXME: we don't have the disclosures anymore. Need to reapply limit disclosure
          credentialRecord: sdJwtVc,
          disclosedPayload: {},
        })

        return onProofAccept()
      })
      .catch((error) => {
        if (error instanceof PidIssuerPinInvalidError) {
          router.setParams({ pinResult: 'error', pin: undefined })
          return
        }

        toast.show('Presentation could not be shared.', {
          customData: { preset: 'danger' },
        })
        agent.config.logger.error('Error accepting presentation', {
          error,
        })
        pushToWallet()
      })
  }, [pin, router, toast.show, agent, pushToWallet, params.uri, onProofAccept, credentialsForRequest])

  if (!submission || !credentialsForRequest) {
    return <GettingInformationScreen type="presentation" />
  }

  const onProofDecline = () => {
    pushToWallet()
    toast.show('Information request has been declined.')
  }

  return (
    <FunkePresentationNotificationScreen
      onAccept={seedCredential ? seedGetPin : onProofAccept}
      onDecline={onProofDecline}
      submission={submission}
      isAccepting={isSharing}
      verifierHost={
        credentialsForRequest.verifierHostName ? `https://${credentialsForRequest.verifierHostName}` : undefined
      }
    />
  )
}
