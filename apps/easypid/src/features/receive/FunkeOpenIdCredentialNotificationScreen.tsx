import type { MdocRecord, SdJwtVcRecord, W3cCredentialRecord } from '@package/agent'

import { useAppAgent } from '@easypid/agent'
import {
  acquireAccessToken,
  getCredentialForDisplay,
  receiveCredentialFromOpenId4VciOffer,
  resolveOpenId4VciOffer,
  storeCredential,
} from '@package/agent'
import { SlideWizard, usePushToWallet } from '@package/app'
import { useToastController } from '@package/ui'
import { useEffect, useMemo, useState } from 'react'
import { createParam } from 'solito'
import { addReceivedActivity, useActivities } from '../activity/activityRecord'
import { CredentialErrorSlide } from './slides/CredentialErrorSlide'
import { LoadingRequestSlide } from './slides/LoadingRequestSlide'
import { OfferCredentialSlide } from './slides/OfferCredentialSlide'
import { VerifyPartySlide } from './slides/VerifyPartySlide'

type Query = { uri?: string; data?: string }

const { useParams } = createParam<Query>()

export function FunkeOpenIdCredentialNotificationScreen() {
  const { agent } = useAppAgent()
  const toast = useToastController()
  const { params } = useParams()
  const pushToWallet = usePushToWallet()

  const [credentialRecord, setCredentialRecord] = useState<W3cCredentialRecord | SdJwtVcRecord | MdocRecord>()
  const [errorReason, setErrorReason] = useState<string>()
  const [isAccepted, setIsAccepted] = useState(false)
  const [isStoring, setIsStoring] = useState(false)

  const credential = credentialRecord ? getCredentialForDisplay(credentialRecord) : undefined

  const { activities } = useActivities({
    filters: {
      host: credential?.display.issuer.domain,
      name: credential?.display.issuer.name,
    },
  })

  useEffect(() => {
    const requestCredential = async (params: Query) => {
      try {
        const { resolvedCredentialOffer } = await resolveOpenId4VciOffer({ agent, offer: params })
        const tokenResponse = await acquireAccessToken({ agent, resolvedCredentialOffer })
        const [credentialRecord] = await receiveCredentialFromOpenId4VciOffer({
          agent,
          resolvedCredentialOffer,
          accessToken: tokenResponse,
        })

        setCredentialRecord(credentialRecord as W3cCredentialRecord | SdJwtVcRecord | MdocRecord)
      } catch (e: unknown) {
        agent.config.logger.error(`Couldn't receive credential from OpenID4VCI offer`, {
          error: e,
        })
        setErrorReason('Credential information could not be extracted')
      }
    }
    void requestCredential(params)
  }, [params, agent])

  const onCredentialAccept = async () => {
    if (!credentialRecord) return

    setIsStoring(true)
    await storeCredential(agent, credentialRecord)
      .then(async () => {
        const { display } = getCredentialForDisplay(credentialRecord)

        await addReceivedActivity(agent, {
          host: display.issuer.domain,
          name: display.issuer.name,
          logo: display.issuer.logo ? display.issuer.logo : undefined,
          backgroundColor: '#ffffff', // Default to a white background for now
          credentialIds: [credentialRecord.id],
        })

        setIsAccepted(true)
      })
      .catch((e) => {
        agent.config.logger.error("Couldn't store credential", {
          error: e as unknown,
        })
        setErrorReason('Couldn’t store credential')
      })
  }

  const onCredentialDecline = () => {
    toast.show('Credential has been declined.')
    pushToWallet('back')
  }

  const onCancel = () => pushToWallet('back')
  const onComplete = () => pushToWallet('replace')

  return (
    <SlideWizard
      steps={[
        {
          step: 'loading-request',
          progress: 16.5,
          screen: <LoadingRequestSlide key="loading-request" isLoading={!credentialRecord} isError={!!errorReason} />,
        },
        {
          step: 'verify-issuer',
          progress: 33,
          backIsCancel: true,
          screen: (
            <VerifyPartySlide
              key="verify-issuer"
              type="offer"
              name={credential?.display.issuer.name}
              logo={credential?.display.issuer.logo}
              host={credential?.display.issuer.domain as string}
              lastInteractionDate={activities[0]?.date}
            />
          ),
        },
        {
          step: 'offer-credential',
          progress: 66,
          screen: (
            <OfferCredentialSlide
              key="offer-credential"
              onAccept={onCredentialAccept}
              onDecline={onCredentialDecline}
              credentialRecord={credentialRecord}
              isStoring={isStoring}
              isAccepted={isAccepted}
              onComplete={onComplete}
            />
          ),
        },
        {
          step: 'credential-error',
          progress: 100,
          backIsCancel: true,
          screen: <CredentialErrorSlide key="credential-error" reason={errorReason} onCancel={onCancel} />,
        },
      ]}
      isError={!!errorReason}
      onCancel={onCancel}
    />
  )
}
