import { useAgent, useDidCommPresentationActions } from '@package/agent'
import { useToastController } from '@package/ui'
import { useState } from 'react'

import { usePushToWallet } from '../../hooks'
import { GettingInformationScreen } from './components/GettingInformationScreen'
import { PresentationNotificationScreen } from './components/PresentationNotificationScreen'
import { commonMessages } from '@package/translations'
import { useLingui } from '@lingui/react/macro'

interface DidCommPresentationNotificationScreenProps {
  proofExchangeId: string
}

export function DidCommPresentationNotificationScreen({ proofExchangeId }: DidCommPresentationNotificationScreenProps) {
  const { agent } = useAgent()

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
    acceptPresentation(selectedCredentials)
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
    declinePresentation().finally(() => {
      void agent.modules.proofs.deleteById(proofExchange.id)
    })

    toast.show(t(commonMessages.informationRequestDeclined))
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
