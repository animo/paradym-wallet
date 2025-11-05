import { defineMessage } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { useToastController } from '@package/ui'
import { useDidCommCredentialActions } from '@paradym/wallet-sdk/hooks'
import { useAgent } from '@paradym/wallet-sdk/src/providers/AgentProvider'
import type { DidCommAgent } from 'packages/sdk/src/agent'
import { usePushToWallet } from '../../hooks'
import { CredentialNotificationScreen } from './components/CredentialNotificationScreen'
import { GettingInformationScreen } from './components/GettingInformationScreen'

interface DidCommCredentialNotificationScreenProps {
  credentialExchangeId: string
}

const credentialNotificationMessages = {
  credentialAdded: defineMessage({
    id: 'common.credentialAdded',
    message: 'Credential has been added to your wallet.',
    comment: 'Toast message shown when credential is successfully added',
  }),
  credentialStoreError: defineMessage({
    id: 'common.credentialStoreError',
    message: 'Something went wrong while storing the credential.',
    comment: 'Toast message shown when there is an error storing the credential',
  }),
  credentialDeclined: defineMessage({
    id: 'common.credentialDeclined',
    message: 'Credential has been declined.',
    comment: 'Toast message shown when credential is declined by the user',
  }),
}

export function DidCommCredentialNotificationScreen({
  credentialExchangeId,
}: DidCommCredentialNotificationScreenProps) {
  const { agent } = useAgent<DidCommAgent>()
  const { t } = useLingui()

  const toast = useToastController()
  const pushToWallet = usePushToWallet()

  const { acceptCredential, acceptStatus, declineCredential, credentialExchange, attributes, display } =
    useDidCommCredentialActions(credentialExchangeId)

  if (!credentialExchange || !attributes || !display) {
    return <GettingInformationScreen type="credential" />
  }

  const onCredentialAccept = async () => {
    void acceptCredential()
      .then(() => {
        toast.show(t(credentialNotificationMessages.credentialAdded), { customData: { preset: 'success' } })
      })
      .catch(() => {
        toast.show(t(credentialNotificationMessages.credentialStoreError), { customData: { preset: 'danger' } })
      })
      .finally(() => {
        pushToWallet()
      })
  }

  const onCredentialDecline = () => {
    void declineCredential().finally(() => {
      void agent.modules.credentials.deleteById(credentialExchange.id)
    })

    toast.show(t(credentialNotificationMessages.credentialDeclined))
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
