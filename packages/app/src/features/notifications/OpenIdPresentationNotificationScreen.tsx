import {
  BiometricAuthenticationCancelledError,
  type CredentialsForProofRequest,
  getCredentialsForProofRequest,
  shareProof,
  useAgent,
} from '@package/agent'
import { useToastController } from '@package/ui'
import { useEffect, useState } from 'react'
import { createParam } from 'solito'

import { usePushToWallet } from '../../hooks'
import { GettingInformationScreen } from './components/GettingInformationScreen'
import { PresentationNotificationScreen } from './components/PresentationNotificationScreen'

type Query = { uri?: string; data?: string }

const { useParams } = createParam<Query>()

export function OpenIdPresentationNotificationScreen() {
  const { agent } = useAgent()
  const toast = useToastController()
  const { params } = useParams()
  const pushToWallet = usePushToWallet()

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
          data: params.data,
          uri: params.uri,
        })
        setCredentialsForRequest(cfr)
      } catch (error: unknown) {
        toast.show('Presentation information could not be extracted.', {
          customData: { preset: 'danger' },
        })
        agent.config.logger.error('Error getting credentials for request', {
          error,
        })

        pushToWallet()
      }
    }

    void handleRequest()
  }, [params, toast.show, agent, pushToWallet, toast])

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
        toast.show('Information has been successfully shared.', {
          customData: { preset: 'success' },
        })
        pushToWallet()
      })
      .catch((e) => {
        if (e instanceof BiometricAuthenticationCancelledError) {
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
          error: e,
        })
        pushToWallet()
      })
  }

  const onProofDecline = () => {
    pushToWallet()
    toast.show('Information request has been declined.')
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
