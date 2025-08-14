import {
  acquirePreAuthorizedAccessToken,
  receiveCredentialFromOpenId4VciOffer,
  resolveOpenId4VciOffer,
} from '@package/agent'
import { useToastController } from '@package/ui'
import { getCredentialForDisplay } from '@paradym/wallet-sdk/display/credential'
import { useParadym } from '@paradym/wallet-sdk/hooks'
import { useOpenId4VcAgent } from '@paradym/wallet-sdk/hooks'
import type { MdocRecord } from '@paradym/wallet-sdk/providers/MdocProvider'
import type { SdJwtVcRecord } from '@paradym/wallet-sdk/providers/SdJwtVcProvider'
import type { W3cCredentialRecord } from '@paradym/wallet-sdk/providers/W3cCredentialsProvider'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { usePushToWallet } from '../../hooks'
import { CredentialNotificationScreen } from './components/CredentialNotificationScreen'
import { GettingInformationScreen } from './components/GettingInformationScreen'

type Query = {
  uri: string
}

export function OpenIdCredentialNotificationScreen() {
  const { paradym } = useParadym('unlocked')
  const { agent } = useOpenId4VcAgent()
  const toast = useToastController()
  const params = useLocalSearchParams<Query>()
  const pushToWallet = usePushToWallet()

  const [credentialRecord, setCredentialRecord] = useState<W3cCredentialRecord | SdJwtVcRecord | MdocRecord>()
  const [isStoring, setIsStoring] = useState(false)

  useEffect(() => {
    const requestCredential = async (params: Query) => {
      try {
        // Only supports pre-auth flow
        const { resolvedCredentialOffer } = await resolveOpenId4VciOffer({ agent, offer: { uri: params.uri } })
        const tokenResponse = await acquirePreAuthorizedAccessToken({ agent, resolvedCredentialOffer })
        const credenitalResponses = await receiveCredentialFromOpenId4VciOffer({
          agent,
          resolvedCredentialOffer,
          accessToken: tokenResponse,
        })

        const credentialRecord = credenitalResponses[0].credential
        setCredentialRecord(credentialRecord)
      } catch (e: unknown) {
        agent.config.logger.error(`Couldn't receive credential from OpenID4VCI offer`, {
          error: e,
        })
        toast.show('Credential information could not be extracted.', { customData: { preset: 'danger' } })
        pushToWallet()
      }
    }
    void requestCredential(params)
  }, [params, agent, toast, pushToWallet])

  if (!credentialRecord) {
    return <GettingInformationScreen type="credential" />
  }

  const onCredentialAccept = async () => {
    setIsStoring(true)

    await paradym.credentials
      .store(credentialRecord)
      .then(() => {
        toast.show('Credential has been added to your wallet.', { customData: { preset: 'success' } })
      })
      .catch((e) => {
        agent.config.logger.error("Couldn't store credential", {
          error: e as unknown,
        })
        toast.show('Something went wrong while storing the credential.', { customData: { preset: 'danger' } })
      })
      .finally(() => {
        pushToWallet()
      })
  }

  const onCredentialDecline = () => {
    toast.show('Credential has been declined.')
    pushToWallet()
  }

  const { display, attributes } = getCredentialForDisplay(credentialRecord)

  return (
    <CredentialNotificationScreen
      display={display}
      attributes={attributes}
      onAccept={() => {
        void onCredentialAccept()
      }}
      onDecline={onCredentialDecline}
      isAccepting={isStoring}
    />
  )
}
