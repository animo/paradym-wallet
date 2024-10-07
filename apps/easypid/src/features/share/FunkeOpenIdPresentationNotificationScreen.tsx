import {
  BiometricAuthenticationCancelledError,
  type CredentialMetadata,
  type EasyPIDAppAgent,
  formatDifPexCredentialsForRequest,
  getCredentialsForProofRequest,
  shareProof,
} from '@package/agent'
import { useToastController } from '@package/ui'
import { useLocalSearchParams } from 'expo-router'
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
import { getHostNameFromUrl } from 'packages/utils/src/url'
import { getPidAttributesForDisplay, usePidCredential } from '../../hooks'
import { activityStorage } from '../activity/activityRecord'
import { FunkePresentationNotificationScreen } from './FunkePresentationNotificationScreen'

type Query = { uri?: string; data?: string }

export interface PresentationRequestResult {
  status: 'success' | 'error'
  result: {
    title: string
    message?: string
  }
  redirectToWallet?: boolean
}

export function FunkeOpenIdPresentationNotificationScreen() {
  const toast = useToastController()
  const params = useLocalSearchParams<Query>()
  const pushToWallet = usePushToWallet()

  const { agent } = useAppAgent()
  const { seedCredential } = useSeedCredentialPidData()
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

  const usePin = useMemo(() => {
    const isPidInSubmission =
      submission?.entries.some((entry) =>
        entry.credentials.some((credential) => credential.id === pidCredential?.id)
      ) ?? false
    return isPidInSubmission && !!seedCredential
  }, [submission, pidCredential, seedCredential])

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

  const onProofAccept = useCallback(async (): Promise<PresentationRequestResult> => {
    if (!submission || !credentialsForRequest)
      return {
        status: 'error',
        result: {
          title: 'No credentials selected',
        },
      }

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

      return {
        status: 'success',
        result: {
          title: 'Presentation shared',
        },
      }
    } catch (error) {
      setIsSharing(false)
      if (error instanceof BiometricAuthenticationCancelledError) {
        return {
          status: 'error',
          result: {
            title: 'Biometric authentication cancelled',
          },
        }
      }
      agent.config.logger.error('Error accepting presentation', {
        error,
      })
      return {
        status: 'error',
        redirectToWallet: true,
        result: {
          title: 'Presentation could not be shared.',
        },
      }
    }
  }, [submission, credentialsForRequest, agent, pidCredential])

  const onProofAcceptWithSeedCredential = async (pin: string): Promise<PresentationRequestResult> => {
    return await requestSdJwtVcFromSeedCredential({
      agent: agent as unknown as EasyPIDAppAgent,
      authorizationRequestUri: params.uri ?? 'TODO: this is temp anyways',
      pidPin: pin,
    })
      .then(async (sdJwtVc) => {
        // We add the newly retrieved SD-JWT VC as the first credential in the credentials for request
        // So it will automatically be selected when creating the presentation
        const entry = credentialsForRequest?.credentialsForRequest.requirements[0].submissionEntry[0]
        entry?.verifiableCredentials.unshift({
          type: ClaimFormat.SdJwtVc,
          // FIXME: we don't have the disclosures anymore. Need to reapply limit disclosure
          credentialRecord: sdJwtVc,
          disclosedPayload: {},
        })

        return await onProofAccept()
      })
      .catch((error) => {
        if (error instanceof PidIssuerPinInvalidError) {
          return {
            status: 'error',
            result: {
              title: 'Wrong PIN',
              message: 'Use your app PIN to confirm the request.',
            },
          }
        }

        if (error instanceof PidIssuerPinLockedError) {
          // FIXME: Redirect to a wallet reset screen.
          return {
            status: 'error',
            redirectToWallet: true,
            result: {
              title: 'Too many incorrect attempts',
              message:
                'You have entered an incorrect PIN. The wallet was locked, please reset it to set a new PIN and continue.',
            },
          }
        }

        agent.config.logger.error('Error accepting presentation', {
          error,
        })

        return {
          status: 'error',
          redirectToWallet: true,
          result: {
            title: 'Presentation could not be shared.',
            message: 'Please try again.',
          },
        }
      })
  }

  const onProofDecline = async () => {
    pushToWallet()
    toast.show('Information request has been declined.')
  }

  return (
    <FunkePresentationNotificationScreen
      usePin={usePin}
      onAccept={onProofAccept}
      onAcceptWithPin={onProofAcceptWithSeedCredential}
      onDecline={onProofDecline}
      submission={submission}
      isAccepting={isSharing}
      verifierName={credentialsForRequest?.verifierHostName ?? 'Party.com'}
      onComplete={() => pushToWallet('replace')}
    />
  )
}
