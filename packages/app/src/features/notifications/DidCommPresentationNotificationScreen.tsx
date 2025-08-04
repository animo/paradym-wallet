import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { useToastController } from '@package/ui'
import { useDidCommPresentationActions } from '@paradym/wallet-sdk/hooks'
import { useState } from 'react'
import { usePushToWallet } from '../../hooks'
import { GettingInformationScreen } from './components/GettingInformationScreen'
import { PresentationNotificationScreen } from './components/PresentationNotificationScreen'

interface DidCommPresentationNotificationScreenProps {
  proofExchangeId: string
}

export function DidCommPresentationNotificationScreen({ proofExchangeId }: DidCommPresentationNotificationScreenProps) {
  const toast = useToastController()
  const pushToWallet = usePushToWallet()
  const { t } = useLingui()

  const { acceptPresentation, declinePresentation, proofExchange, acceptStatus, submission, verifierName } =
    useDidCommPresentationActions(proofExchangeId)

  const [selectedCredentials, setSelectedCredentials] = useState<{
    [inputDescriptorId: string]: string
  }>({})

  if (!submission || !proofExchange) {
    return <GettingInformationScreen type="presentation" />
  }

  const onProofAccept = () => {
    acceptPresentation({ selectedCredentials, storeAsActivity: false })
      .then(() => {
        toast.show(t(commonMessages.presentationShared), { customData: { preset: 'success' } })
      })
      .catch(() => {
        toast.show(t(commonMessages.presentationCouldNotBeShared), { customData: { preset: 'danger' } })
      })
      .finally(() => {
        pushToWallet()
      })
  }

  const onProofDecline = () => {
    toast.show(t(commonMessages.informationRequestDeclined))

    void declinePresentation().finally(() => {
      void paradym.agent.modules.proofs.deleteById(proofExchange.id)
    })

    pushToWallet()
  }

  return (
    <PresentationNotificationScreen
      onAccept={onProofAccept}
      onDecline={onProofDecline}
      submission={submission}
      // If state is not idle, it means we have pressed accept
      isAccepting={acceptStatus !== 'idle'}
      verifierName={verifierName}
      selectedCredentials={selectedCredentials}
      onSelectCredentialForInputDescriptor={(groupName: string, credentialId: string) =>
        setSelectedCredentials((selectedCredentials) => ({
          ...selectedCredentials,
          [groupName]: credentialId,
        }))
      }
    />
  )
}
