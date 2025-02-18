import { useAgent, useDidCommCredentialActions } from '@package/agent'
import { useToastController } from '@package/ui'

import { usePushToWallet } from '../../hooks'
import { CredentialNotificationScreen } from './components/CredentialNotificationScreen'
import { GettingInformationScreen } from './components/GettingInformationScreen'

interface DidCommCredentialNotificationScreenProps {
  credentialExchangeId: string
}

export function DidCommCredentialNotificationScreen({
  credentialExchangeId,
}: DidCommCredentialNotificationScreenProps) {
  const { agent } = useAgent()

  const toast = useToastController()
  const pushToWallet = usePushToWallet()

  const { acceptCredential, acceptStatus, declineCredential, credentialExchange, attributes, display } =
    useDidCommCredentialActions(credentialExchangeId)

  if (!credentialExchange || !attributes || !display) {
    return <GettingInformationScreen type="credential" />
  }

  const onCredentialAccept = async () => {
    await acceptCredential()
      .then(() => {
        toast.show('Credential has been added to your wallet.', { customData: { preset: 'success' } })
      })
      .catch(() => {
        toast.show('Something went wrong while storing the credential.', { customData: { preset: 'danger' } })
      })
      .finally(() => {
        pushToWallet()
      })
  }

  const onCredentialDecline = () => {
    declineCredential().finally(() => {
      void agent.modules.credentials.deleteById(credentialExchange.id)
    })

    toast.show('Credential has been declined.')
    pushToWallet()
  }

  return (
    <CredentialNotificationScreen
      display={display}
      attributes={attributes}
      onAccept={() => {
        void onCredentialAccept()
      }}
      onDecline={onCredentialDecline}
      // If state is not idle, it means we have pressed accept
      isAccepting={acceptStatus !== 'idle'}
    />
  )
}
