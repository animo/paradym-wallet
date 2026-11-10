import { Trans, useLingui } from '@lingui/react/macro'
import { ConfirmationSheet, DualResponseButtons, SlidePane, useHaptics, useWizard } from '@package/app'
import { commonMessages } from '@package/translations'
import {
  Circle,
  Heading,
  Image,
  InfoButton,
  Paragraph,
  ScrollView,
  Stack,
  TwoPane,
  useMedia,
  XStack,
  YStack,
} from '@package/ui'
import { formatRelativeDate } from '@package/utils'
import type { DisplayImage, TrustedEntity } from '@paradym/wallet-sdk'
import { useActivities } from '@paradym/wallet-sdk'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'

const NO_ENTITY_ID = 'NO_ENTITY_ID'

interface VerifyPartySlideProps {
  type: 'offer' | 'request' | 'signing' | 'connect'
  host?: string
  name?: string
  entityId?: string
  logo?: DisplayImage
  backgroundColor?: string
  onContinue?: () => Promise<void>
  onDecline?: () => void
  trustedEntities?: Array<TrustedEntity>
  /** Whether the offer is for a card the organization isn't registered to issue, or the request asks for more than it registered */
  isBeyondRegistration?: boolean
}

export const VerifyPartySlide = ({
  type,
  entityId = NO_ENTITY_ID,
  name,
  logo,
  backgroundColor,
  onContinue,
  onDecline,
  trustedEntities,
  isBeyondRegistration,
}: VerifyPartySlideProps) => {
  const router = useRouter()
  const media = useMedia()
  const { onNext, onCancel, isCombined, setCombinedContinue, setCombinedConfirm, ownsWideLayout } = useWizard()
  const { withHaptics } = useHaptics()
  const [isLoading, setIsLoading] = useState(false)
  const { activities } = useActivities({ filters: { entityId }, limit: 1 })
  const lastInteractionDate = activities[0]?.date
  const { t } = useLingui()
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [isRegistrationWarningOpen, setIsRegistrationWarningOpen] = useState(false)
  const resolveRegistrationWarning = useRef<(confirmed: boolean) => void>(undefined)
  const isRegistrationWarningConfirmed = useRef(false)

  const entityIsTrustAnchor = trustedEntities?.some((entity) => entity.entityId === entityId)
  const isDemoTrustedEntity = trustedEntities?.some((entity) => entity.demo) ?? false
  const trustedEntitiesWithoutSelf = trustedEntities?.filter((entity) => entity.entityId !== entityId)

  // With the country of its trusted list, as several countries can list the same kind of organization
  const approvedBy = trustedEntitiesWithoutSelf?.[0]
  const territoryMessage = approvedBy?.territory
    ? commonMessages.trustedListTerritories[approvedBy.territory]
    : undefined
  const approvedByTerritory = territoryMessage ? t(territoryMessage) : approvedBy?.territory

  // Next to the next step in a wide window, that step's buttons continue this one
  useEffect(() => {
    setCombinedContinue?.(onContinue)
    return () => setCombinedContinue?.(undefined)
  }, [setCombinedContinue, onContinue])

  // Going beyond the registration is confirmed a second time, once, before continuing from this step or the step next to it
  const confirmRegistrationWarning = useCallback(() => {
    if (isRegistrationWarningConfirmed.current) return Promise.resolve(true)
    return new Promise<boolean>((resolve) => {
      resolveRegistrationWarning.current = resolve
      setIsRegistrationWarningOpen(true)
    })
  }, [])

  const closeRegistrationWarning = (confirmed: boolean) => {
    isRegistrationWarningConfirmed.current = confirmed
    setIsRegistrationWarningOpen(false)
    resolveRegistrationWarning.current?.(confirmed)
    resolveRegistrationWarning.current = undefined
  }

  useEffect(() => {
    setCombinedConfirm?.(isBeyondRegistration ? confirmRegistrationWarning : undefined)
    return () => setCombinedConfirm?.(undefined)
  }, [setCombinedConfirm, isBeyondRegistration, confirmRegistrationWarning])

  const registrationWarning = !isBeyondRegistration
    ? undefined
    : type === 'offer'
      ? {
          title: t({
            id: 'verifyPartySlide.notRegisteredToIssue',
            message: 'Not registered for this card',
            comment: 'Title of the warning shown when an organization offers a card it is not registered to issue',
          }),
          description: name
            ? t({
                id: 'verifyPartySlide.notRegisteredToIssueWarning',
                message: `${name} is not registered to issue this card. Only continue if you trust it`,
                comment:
                  'Warning shown when an organization offers a card it is not registered to issue, with the name of the organization',
              })
            : t({
                id: 'verifyPartySlide.notRegisteredToIssueWarningUnknownOrganization',
                message: 'This organization is not registered to issue this card. Only continue if you trust it',
                comment:
                  'Warning shown when an organization offers a card it is not registered to issue, when the name of the organization is unknown',
              }),
          // The card is only added once it is accepted, after it is received
          confirmation: name
            ? t({
                id: 'verifyPartySlide.notRegisteredToIssueConfirmationDescription',
                message: `${name} offers a card it is not registered to issue. You can review the card before it is added.`,
                comment:
                  'Shown in the sheet that asks to confirm continuing with an offer of a card the organization is not registered to issue, with the name of the organization',
              })
            : t({
                id: 'verifyPartySlide.notRegisteredToIssueConfirmationDescriptionUnknownOrganization',
                message:
                  'This organization offers a card it is not registered to issue. You can review the card before it is added.',
                comment:
                  'Shown in the sheet that asks to confirm continuing with an offer of a card the organization is not registered to issue, when the name of the organization is unknown',
              }),
        }
      : {
          title: t(commonMessages.overAsking),
          description: name
            ? t(commonMessages.overAskingWarning(name))
            : t(commonMessages.overAskingWarningUnknownOrganization),
          // Next to the next step, confirming acts right away, so there is nothing left to review
          confirmation: isCombined
            ? name
              ? t({
                  id: 'verifyPartySlide.overAskingConfirmationDescriptionCombined',
                  message: `${name} asks for more than it registered.`,
                  comment:
                    'Shown in the sheet that asks to confirm a request that asks for more than the organization registered, next to the request itself, with the name of the organization',
                })
              : t({
                  id: 'verifyPartySlide.overAskingConfirmationDescriptionCombinedUnknownOrganization',
                  message: 'This organization asks for more than it registered.',
                  comment:
                    'Shown in the sheet that asks to confirm a request that asks for more than the organization registered, next to the request itself, when the name of the organization is unknown',
                })
            : name
              ? t({
                  id: 'verifyPartySlide.overAskingConfirmationDescription',
                  message: `${name} asks for more than it registered. You can review the request before anything is shared.`,
                  comment:
                    'Shown in the sheet that asks to confirm continuing with a request that asks for more than the organization registered, with the name of the organization',
                })
              : t({
                  id: 'verifyPartySlide.overAskingConfirmationDescriptionUnknownOrganization',
                  message:
                    'This organization asks for more than it registered. You can review the request before anything is shared.',
                  comment:
                    'Shown in the sheet that asks to confirm continuing with a request that asks for more than the organization registered, when the name of the organization is unknown',
                }),
        }

  const handleContinue = async () => {
    setIsLoading(true)
    if (onContinue) {
      await onContinue()
    }
    onNext()
    setIsLoading(false)
  }

  const handleDecline = async () => {
    onDecline?.()
    onCancel()
  }

  const onPressInteraction = withHaptics(() => {
    router.push(`/activity?entityId=${entityId}`)
  })

  const header = (
    <YStack gap="5" pt="5">
      {logo?.url && (
        <XStack items="center" justify="center">
          <Circle size={88} borderWidth="1" borderColor="grey-100" bg={backgroundColor ?? 'white'}>
            <Image
              circle
              src={logo.url}
              alt={logo.altText}
              testID={isImageLoaded ? 'entity-image-loaded' : 'entity-image'}
              onLoad={() => setIsImageLoaded(true)}
              width="100%"
              height="100%"
              contentFit="contain"
            />
          </Circle>
        </XStack>
      )}
      <Stack gap="2">
        <Heading heading="h2" numberOfLines={2} fontSize={24} lineHeight="5" center>
          {name ? t(commonMessages.doYouTrust(name)) : t(commonMessages.organizationNotVerifiedHeading)}
        </Heading>
        {type === 'offer' ? (
          <Paragraph center px="5">
            {name ? (
              <Trans id="verifyPartySlide.offerCardSubtitle">{name} wants to offer you a card.</Trans>
            ) : (
              <Trans id="verifyPartySlide.offerCardSubtitleUnknownOrganization">
                An unknown organization wants to offer you a card.
              </Trans>
            )}
          </Paragraph>
        ) : type === 'signing' ? (
          <Paragraph center px="5">
            {name ? (
              <Trans id="verifyPartySlide.signingSubtitle">
                {name} wants to interact to create a digital signature for a document.
              </Trans>
            ) : (
              <Trans id="verifyPartySlide.signingSubtitleUnknownOrganization">
                An unknown organization wants to interact to create a digital signature for a document.
              </Trans>
            )}
          </Paragraph>
        ) : type === 'request' ? (
          <Paragraph center px="5">
            {name ? (
              <Trans id="verifyPartySlide.requestSubtitle">{name} wants to request information from you.</Trans>
            ) : (
              <Trans id="verifyPartySlide.requestSubtitleUnknownOrganization">
                An unknown organization wants to request information from you.
              </Trans>
            )}
          </Paragraph>
        ) : type === 'connect' ? (
          <Paragraph center px="5">
            {name ? (
              <Trans id="verifyPartySlide.connectSubtitle">{name} wants to connect with you.</Trans>
            ) : (
              <Trans id="verifyPartySlide.connectSubtitleUnknownOrganization">
                An unknown organization wants to connect with you.
              </Trans>
            )}
          </Paragraph>
        ) : null}
      </Stack>
    </YStack>
  )

  const trustDetails = (
    <YStack gap="5">
      {/* Only a recognized organization is checked against its registration, so the warning takes its place */}
      {registrationWarning ? (
        <InfoButton variant="danger" title={registrationWarning.title} description={registrationWarning.description} />
      ) : trustedEntitiesWithoutSelf && (trustedEntitiesWithoutSelf.length > 0 || entityIsTrustAnchor) ? (
        <InfoButton
          variant="positive"
          title={t(commonMessages.recognizedOrganization)}
          description={
            approvedBy
              ? approvedByTerritory
                ? t(commonMessages.approvedByInTerritory(approvedBy.organizationName, approvedByTerritory))
                : t(commonMessages.approvedBy(approvedBy.organizationName))
              : undefined
          }
        />
      ) : (
        <InfoButton
          variant="warning"
          title={t(commonMessages.unknownOrganization)}
          description={t(commonMessages.organizationNotVerifiedDescription)}
        />
      )}
      {isDemoTrustedEntity && (
        <InfoButton
          variant="warning"
          title={t(commonMessages.demoOrganization)}
          description={t(commonMessages.demoOrganizationWarning)}
        />
      )}
      <InfoButton
        variant={lastInteractionDate ? 'interaction-success' : 'interaction-new'}
        title={
          lastInteractionDate
            ? t({
                id: 'verifyPartySlide.hasPreviousInteractionsTitle',
                message: 'Previous interactions',
              })
            : t({
                id: 'verifyPartySlide.hasNoPreviousInteractionsTitle',
                message: 'First time interaction',
              })
        }
        description={
          lastInteractionDate
            ? t({
                id: 'verifyPartySlide.hasPreviousInteractionsDescription',
                message: `Last interaction: ${formatRelativeDate(new Date(lastInteractionDate))}`,
              })
            : t({
                id: 'verifyPartySlide.hasNoPreviousInteractionsDescription',
                message: 'No previous interactions found',
              })
        }
        onPress={lastInteractionDate ? onPressInteraction : undefined}
      />
    </YStack>
  )

  const footer = (
    <Stack borderTopWidth={1} borderColor="grey-100" px="5" pt="3" mx="-5">
      <DualResponseButtons
        align="horizontal"
        onAccept={async () => {
          if (registrationWarning && !(await confirmRegistrationWarning())) return
          await handleContinue()
        }}
        onDecline={handleDecline}
        acceptText={t(commonMessages.confirmContinue)}
        declineText={t(commonMessages.stop)}
        isLoading={isLoading}
        variant={registrationWarning ? 'confirmation' : 'regular'}
      />
    </Stack>
  )

  const registrationWarningSheet = registrationWarning && (
    <ConfirmationSheet
      isOpen={isRegistrationWarningOpen}
      setIsOpen={(isOpen) => (isOpen ? setIsRegistrationWarningOpen(true) : closeRegistrationWarning(false))}
      title={t({
        id: 'verifyPartySlide.overAskingConfirmationTitle',
        message: 'Continue anyway?',
        comment:
          'Title of the sheet that asks to confirm continuing with an organization that goes beyond what it registered, such as a request that asks for more than it registered',
      })}
      description={registrationWarning.confirmation}
      confirmText={t(commonMessages.confirmContinue)}
      onConfirm={() => closeRegistrationWarning(true)}
    />
  )

  if (ownsWideLayout) {
    // Wide windows show who it is on the left, next to whether to trust them
    return (
      <>
        <TwoPane
          start={<SlidePane>{header}</SlidePane>}
          end={
            <SlidePane>
              <YStack grow={1} justify="space-between" gap="5">
                {trustDetails}
                {footer}
              </YStack>
            </SlidePane>
          }
        />
        {registrationWarningSheet}
      </>
    )
  }

  return (
    // Shrinks to the window's height, so the buttons stay at the bottom and the content above them scrolls
    <YStack flex={1} justify="space-between">
      <ScrollView contentContainerStyle={{ gap: media.short ? '5' : '8', paddingBottom: '5' }}>
        {header}
        {trustDetails}
      </ScrollView>
      {!isCombined && footer}
      {registrationWarningSheet}
    </YStack>
  )
}
