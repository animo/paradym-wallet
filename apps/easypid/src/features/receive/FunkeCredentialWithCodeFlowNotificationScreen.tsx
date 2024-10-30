import type { MdocRecord, SdJwtVcRecord, W3cCredentialRecord } from '@package/agent'

import { useAppAgent } from '@easypid/agent'
import { getOpenIdFedIssuerMetadata } from '@easypid/utils/issuer'

import { SlideWizard, usePushToWallet } from '@package/app'
import { useToastController } from '@package/ui'
import { useEffect, useMemo, useState } from 'react'
import { createParam } from 'solito'
import { useActivities } from '../activity/activityRecord'
import { AuthCodeFlowSlide } from './slides/AuthCodeFlowSlide'
import { CredentialErrorSlide } from './slides/CredentialErrorSlide'
import { LoadingRequestSlide } from './slides/LoadingRequestSlide'
import { OfferCredentialSlide } from './slides/OfferCredentialSlide'
import { VerifyPartySlide } from './slides/VerifyPartySlide'

type Query = { uri?: string; data?: string }

export type AuthCodeFlowDetails = {
  domain: string
  redirectUri: string
  openUrl: string
}

const { useParams } = createParam<Query>()

// Step 1 - Loading the request
// Step 2 - Verify the issuer
// Step 3 - Auth code flow explanation
// Step 4 - Open browser
// Step 5 - Loading screen with browser redirect data
// Step 6 - Show credential received and accept or decline

export function FunkeCredentialWithCodeFlowNotificationScreen() {
  const { agent } = useAppAgent()
  const toast = useToastController()
  const { params } = useParams()
  const { activities } = useActivities()
  const pushToWallet = usePushToWallet()

  const [errorReason, setErrorReason] = useState<string>()
  const [isAccepted, setIsAccepted] = useState(false)
  const [isStoring, setIsStoring] = useState(false)

  const [credentialRecord, setCredentialRecord] = useState<SdJwtVcRecord | W3cCredentialRecord | MdocRecord>()
  const [authCodeFlowDetails, setAuthCodeFlowDetails] = useState<AuthCodeFlowDetails>()

  const issuerMetadata = useMemo(
    () => getOpenIdFedIssuerMetadata(authCodeFlowDetails?.domain as string),
    [authCodeFlowDetails?.domain]
  )

  const lastInteractionDate = useMemo(() => {
    const activity = activities.find((activity) => activity.entity.host === authCodeFlowDetails?.domain)
    return activity?.date
  }, [activities, authCodeFlowDetails?.domain])

  useEffect(() => {
    const requestAuthCodeFlowDetails = async (params: Query) => {
      // === IMPLEMENT HERE ===
      setAuthCodeFlowDetails({
        domain: 'funke.animo.id',
        redirectUri: 'easypid://',
        openUrl: 'https://example.com',
      })
    }
    void requestAuthCodeFlowDetails(params)
  }, [params])

  const onAuthFlowCallback = (result: Record<string, unknown>) => {
    // === IMPLEMENT HERE ===
    // Use result to obtain credential record
    setCredentialRecord({} as SdJwtVcRecord)
  }

  const onCredentialAccept = async () => {
    setIsStoring(true)
    await Promise.resolve()
      .then(async () => {
        setIsAccepted(true)
      })
      .catch((e) => {
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
          screen: (
            <LoadingRequestSlide key="loading-request" isLoading={!authCodeFlowDetails} isError={!!errorReason} />
          ),
        },
        {
          step: 'verify-issuer',
          progress: 33,
          backIsCancel: true,
          screen: (
            <VerifyPartySlide
              key="verify-issuer"
              type="offer"
              name={issuerMetadata?.display.name ?? 'Example Issuer'}
              logo={issuerMetadata?.display.logo}
              host={authCodeFlowDetails?.domain as string}
              lastInteractionDate={lastInteractionDate}
              approvalsCount={issuerMetadata?.approvals.length}
            />
          ),
        },
        {
          step: 'auth-code-flow',
          progress: 49.5,
          screen: (
            <AuthCodeFlowSlide
              key="auth-code-flow"
              authCodeFlowDetails={authCodeFlowDetails}
              onAuthFlowCallback={onAuthFlowCallback}
              onCancel={onCredentialDecline}
            />
          ),
        },
        {
          step: 'loading-browser',
          progress: 66,
          screen: <LoadingRequestSlide key="loading-browser" isLoading={!credentialRecord} isError={!!errorReason} />,
        },
        {
          step: 'offer-credential',
          progress: 83,
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
