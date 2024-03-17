import type { W3cCredentialRecord, SdJwtVcRecord } from '@internal/agent'

import {
  getCredentialForDisplay,
  storeCredential,
  receiveCredentialFromOpenId4VciOffer,
  useAgent,
} from '@internal/agent'
import { useToastController } from '@internal/ui'
import React, { useEffect, useState } from 'react'
import { createParam } from 'solito'
import { useRouter } from 'solito/router'

import { CredentialNotificationScreen } from './components/CredentialNotificationScreen'
import { GettingCredentialInformationScreen } from './components/GettingCredentialInformationScreen'

type Query = { uri: string }

const { useParam } = createParam<Query>()

export function OpenIdCredentialNotificationScreen() {
  const { agent } = useAgent()
  const router = useRouter()
  const toast = useToastController()
  const [uri] = useParam('uri')

  const [credentialRecord, setCredentialRecord] = useState<W3cCredentialRecord | SdJwtVcRecord>()
  const [isStoring, setIsStoring] = useState(false)

  const pushToWallet = () => {
    router.back()
    router.push('/')
  }

  useEffect(() => {
    const requestCredential = async (uri: string) => {
      try {
        const credentialRecord = await receiveCredentialFromOpenId4VciOffer({
          agent,
          data: decodeURIComponent(uri),
        })

        setCredentialRecord(credentialRecord)
      } catch (e) {
        agent.config.logger.error("Couldn't receive credential from OpenID4VCI offer", {
          error: e as unknown,
        })
        toast.show('Credential information could not be extracted.')
        pushToWallet()
      }
    }
    if (uri) void requestCredential(uri)
  }, [uri])

  if (!credentialRecord) {
    return <GettingCredentialInformationScreen />
  }

  const onCredentialAccept = async () => {
    setIsStoring(true)

    await storeCredential(agent, credentialRecord)
      .then(() => {
        toast.show('Credential has been added to your wallet.')
      })
      .catch((e) => {
        agent.config.logger.error("Couldn't store credential", {
          error: e as unknown,
        })
        toast.show('Something went wrong while storing the credential.')
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
