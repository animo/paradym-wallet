import {
  BiometricAuthenticationCancelledError,
  type CredentialMetadata,
  type EasyPIDAppAgent,
  formatDifPexCredentialsForRequest,
  getCredentialsForProofRequest,
  getReadableNameFromHost,
  shareProof,
} from '@package/agent'
import { useToastController } from '@package/ui'
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState, useMemo, useCallback } from 'react'

import { ClaimFormat, utils } from '@credo-ts/core'
import { useAppAgent } from '@easypid/agent'
import {
  PidIssuerPinInvalidError,
  PidIssuerPinLockedError,
  requestSdJwtVcFromSeedCredential,
} from '@easypid/crypto/bPrime'
import { useSeedCredentialPidData } from '@easypid/storage'
import { usePushToWallet } from '@package/app/src/hooks/usePushToWallet'
import { getPidAttributesForDisplay, usePidCredential } from '../../hooks'
import { activityStorage } from '../activity/activityRecord'
import { FunkePresentationNotificationScreen } from './FunkePresentationNotificationScreen'

type Query = { uri?: string; data?: string }

export function FunkeOpenIdPresentationNotificationScreen() {
  const { agent } = useAppAgent()
  const router = useRouter()
  const toast = useToastController()
  const { pin } = useGlobalSearchParams<{ pin?: string }>()
  const params = useLocalSearchParams<Query>()
  const { seedCredential } = useSeedCredentialPidData()
  const pushToWallet = usePushToWallet()
  const { credential: pidCredential } = usePidCredential()

  const [credentialsForRequest, setCredentialsForRequest] =
    useState<Awaited<ReturnType<typeof getCredentialsForProofRequest>>>()
  const [isSharing, setIsSharing] = useState(false)

  const submission = useMemo(() => {
    if (!credentialsForRequest) return undefined

    const formattedSubmission = formatDifPexCredentialsForRequest(credentialsForRequest.credentialsForRequest)

    // Filter to keep only the first credential for each type
    const filteredSubmission = {
      ...formattedSubmission,
      entries: formattedSubmission.entries.map((entry) => {
        const uniqueCredentials = new Map()
        return {
          ...entry,
          credentials: entry.credentials
            .filter((credential) => credential.metadata?.type)
            .filter((credential) => {
              const type = credential.metadata?.type
              if (!uniqueCredentials.has(type)) {
                uniqueCredentials.set(type, credential)
                return true
              }
              return false
            }),
        }
      }),
    }

    return filteredSubmission
  }, [credentialsForRequest])

  useEffect(() => {
    if (credentialsForRequest) return

    getCredentialsForProofRequest({
      agent,
      data: params.data,
      uri: params.uri,
      allowUntrustedCertificates: true,
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

  const onProofAccept = useCallback(async () => {
    if (!submission || !credentialsForRequest) return

    setIsSharing(true)

    try {
      await shareProof({
        agent,
        authorizationRequest: credentialsForRequest.authorizationRequest,
        credentialsForRequest: credentialsForRequest.credentialsForRequest,
        selectedCredentials: {},
        allowUntrustedCertificate: true,
      })

      const credential = submission.entries[0]?.credentials[0]
      const disclosedPayload =
        credential?.metadata?.type === pidCredential?.type
          ? getPidAttributesForDisplay(
              credential.disclosedPayload ?? {},
              credential.metadata ?? ({} as CredentialMetadata),
              credential.claimFormat as ClaimFormat.SdJwtVc | ClaimFormat.MsoMdoc
            )
          : credential?.disclosedPayload

      await activityStorage.addActivity(agent, {
        id: utils.uuid(),
        type: 'shared',
        disclosedPayload,
        date: new Date().toISOString(),
        entityHost: credentialsForRequest.verifierHostName as string,
      })
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
  }, [submission, credentialsForRequest, agent, pushToWallet, toast.show, pidCredential])

  useEffect(() => {
    if (!pin) return

    requestSdJwtVcFromSeedCredential({
      agent: agent as unknown as EasyPIDAppAgent,
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

        if (error instanceof PidIssuerPinLockedError) {
          router.replace('pinLocked')
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

  const onProofDecline = async () => {
    pushToWallet()
    toast.show('Information request has been declined.')
  }

  return (
    <FunkePresentationNotificationScreen
      usePin={!!seedCredential}
      onAccept={onProofAccept}
      onDecline={onProofDecline}
      submission={submission}
      isAccepting={isSharing}
      verifierName={getReadableNameFromHost(credentialsForRequest?.verifierHostName ?? 'Party.com')}
      onComplete={() => pushToWallet('replace')}
    />
  )
}
