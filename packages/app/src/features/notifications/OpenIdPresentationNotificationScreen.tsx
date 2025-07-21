import {
  BiometricAuthenticationCancelledError,
  type CredentialsForProofRequest,
  getCredentialsForProofRequest,
  shareProof,
  useAgent,
} from '@package/agent'
import { useToastController } from '@package/ui'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'

import { usePushToWallet } from '../../hooks'
import { GettingInformationScreen } from './components/GettingInformationScreen'
import { PresentationNotificationScreen } from './components/PresentationNotificationScreen'
import { commonMessages } from '@package/translations'
import { useLingui } from '@lingui/react/macro'

type Query = {
  uri: string
}

export function OpenIdPresentationNotificationScreen() {
  const { agent } = useAgent()
  const toast = useToastController()
  const params = useLocalSearchParams<Query>()
  const pushToWallet = usePushToWallet()
  const { t } = useLingui()

  const [credentialsForRequest, setCredentialsForRequest] = useState<CredentialsForProofRequest>()
  const [isSharing, setIsSharing] = useState(false)

  const [selectedCredentials, setSelectedCredentials] = useState<{
    [inputDescriptorId: string]: string
  }>({})

  useEffect(() => {
    async function handleRequest() {
      try {
        const cfr = await getCredentialsForProofRequest({
          agent,
          uri: params.uri,
        })
        setCredentialsForRequest(cfr)
      } catch (error: unknown) {
        toast.show(t(commonMessages.presentationInformationCouldNotBeExtracted), {
          customData: { preset: 'danger' },
        })
        agent.config.logger.error('Error getting credentials for request', {
          error,
        })

        pushToWallet()
      }
    }

    void handleRequest()
  }, [params, toast.show, agent, pushToWallet, toast, t])

  if (!credentialsForRequest) {
    return <GettingInformationScreen type="presentation" />
  }

  const onProofAccept = () => {
    setIsSharing(true)

    shareProof({
      agent,
      resolvedRequest: credentialsForRequest,
      selectedCredentials,
    })
      .then(() => {
        toast.show(t(commonMessages.presentationShared), {
          customData: { preset: 'success' },
        })
        pushToWallet()
      })
      .catch((e) => {
        if (e instanceof BiometricAuthenticationCancelledError) {
          toast.show(t(commonMessages.biometricAuthenticationCancelled), {
            customData: { preset: 'danger' },
          })
          setIsSharing(false)
          return
        }

        toast.show(t(commonMessages.presentationCouldNotBeShared), {
          customData: { preset: 'danger' },
        })
        agent.config.logger.error('Error accepting presentation', {
          error: e,
        })
        pushToWallet()
      })
  }

  const onProofDecline = () => {
    pushToWallet()
    toast.show(t(commonMessages.informationRequestDeclined))
  }

  return (
    <PresentationNotificationScreen
      onAccept={onProofAccept}
      onDecline={onProofDecline}
      submission={credentialsForRequest.formattedSubmission}
      isAccepting={isSharing}
      verifierName={credentialsForRequest.verifier.name ?? credentialsForRequest.verifier.hostName}
      selectedCredentials={selectedCredentials}
      onSelectCredentialForInputDescriptor={(inputDescriptorId: string, credentialId: string) =>
        setSelectedCredentials((selectedCredentials) => ({
          ...selectedCredentials,
          [inputDescriptorId]: credentialId,
        }))
      }
    />
  )
}
