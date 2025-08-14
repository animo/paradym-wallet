import { eudiTrustList, trustedEntityIds, trustedX509Entities } from '@easypid/constants'
import { useToastController } from '@package/ui'
import { ParadymWalletBiometricAuthenticationCancelledError } from '@paradym/wallet-sdk/error'
import { useParadym } from '@paradym/wallet-sdk/hooks'
import { shareProof } from '@paradym/wallet-sdk/invitation/shareProof'
import {
  type CredentialsForProofRequest,
  getCredentialsForProofRequest,
} from '@paradym/wallet-sdk/openid4vc/getCredentialsForProofRequest'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { usePushToWallet } from '../../hooks'
import { GettingInformationScreen } from './components/GettingInformationScreen'
import { PresentationNotificationScreen } from './components/PresentationNotificationScreen'

type Query = {
  uri: string
}

export function OpenIdPresentationNotificationScreen() {
  const { paradym } = useParadym('unlocked')
  const toast = useToastController()
  const params = useLocalSearchParams<Query>()
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
          paradym,
          uri: params.uri,
          trustList: eudiTrustList,
          trustedX509Entities,
          trustedEntityIds,
        })
        setCredentialsForRequest(cfr)
      } catch (error: unknown) {
        toast.show('Presentation information could not be extracted.', {
          customData: { preset: 'danger' },
        })
        paradym.logger.error('Error getting credentials for request', {
          error,
        })

        pushToWallet()
      }
    }

    void handleRequest()
  }, [params, toast.show, paradym, pushToWallet, toast])

  if (!credentialsForRequest) {
    return <GettingInformationScreen type="presentation" />
  }

  const onProofAccept = () => {
    setIsSharing(true)

    shareProof({
      paradym,
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
        if (e instanceof ParadymWalletBiometricAuthenticationCancelledError) {
          toast.show('Biometric authentication cancelled', {
            customData: { preset: 'danger' },
          })
          setIsSharing(false)
          return
        }

        toast.show('Presentation could not be shared.', {
          customData: { preset: 'danger' },
        })
        paradym.logger.error('Error accepting presentation', {
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
