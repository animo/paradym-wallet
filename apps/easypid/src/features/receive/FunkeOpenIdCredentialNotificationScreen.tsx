import type { SdJwtVcRecord, W3cCredentialRecord } from '@package/agent'

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
import { getHostNameFromUrl } from 'packages/utils/src'
import { useEffect, useState } from 'react'
import { createParam } from 'solito'
import { activityStorage } from '../activity/activityRecord'
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

  const [credentialRecord, setCredentialRecord] = useState<W3cCredentialRecord | SdJwtVcRecord>()
  const [errorReason, setErrorReason] = useState<string>()
  const [isAccepted, setIsAccepted] = useState(false)
  const [isStoring, setIsStoring] = useState(false)

  const credential = credentialRecord ? getCredentialForDisplay(credentialRecord) : undefined

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

        if (credentialRecord.type === 'MdocRecord') {
          throw new Error('mdoc not supported')
        }
        setCredentialRecord(credentialRecord)
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
        const { metadata, display } = getCredentialForDisplay(credentialRecord)

        await activityStorage.addActivity(agent, {
          id: credentialRecord.id,
          type: 'received',
          date: new Date().toISOString(),
          entityHost: getHostNameFromUrl(metadata.issuer) as string,
          entityName: display.issuer.name,
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
              name={credential?.display.issuer.name}
              logo={credential?.display.issuer.logo}
              // @ts-expect-error
              domain={credentialRecord?.metadata.issuer as string}
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
