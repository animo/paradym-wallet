import type { MdocRecord, SdJwtVcRecord, W3cCredentialRecord } from '@package/agent'

import {
  acquireAccessToken,
  getCredentialForDisplay,
  receiveCredentialFromOpenId4VciOffer,
  resolveOpenId4VciOffer,
  storeCredential,
  useAgent,
} from '@package/agent'
import { useToastController } from '@package/ui'
import React, { useCallback, useEffect, useState } from 'react'
import { createParam } from 'solito'
import { useRouter } from 'solito/router'

import { CredentialNotificationScreen } from './components/CredentialNotificationScreen'
import { GettingInformationScreen } from './components/GettingInformationScreen'

type Query = { uri?: string; data?: string }

const { useParams } = createParam<Query>()

export function OpenIdCredentialNotificationScreen() {
  const { agent } = useAgent()
  const router = useRouter()
  const toast = useToastController()
  const { params } = useParams()

  const [credentialRecord, setCredentialRecord] = useState<W3cCredentialRecord | SdJwtVcRecord | MdocRecord>()
  const [isStoring, setIsStoring] = useState(false)

  const pushToWallet = useCallback(() => {
    router.back()
    router.push('/')
  }, [router.back, router.push])

  useEffect(() => {
    const requestCredential = async (params: Query) => {
      try {
        // Only supports pre-auth flow
        const { resolvedCredentialOffer } = await resolveOpenId4VciOffer({ agent, offer: params })
        const tokenResponse = await acquireAccessToken({ agent, resolvedCredentialOffer })
        const [credentialRecord] = await receiveCredentialFromOpenId4VciOffer({
          agent,
          resolvedCredentialOffer,
          accessToken: tokenResponse,
        })

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

    await storeCredential(agent, credentialRecord)
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
