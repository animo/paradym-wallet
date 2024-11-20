import type { DisplayImage } from '@package/agent'

import { Circle, Heading, HeroIcons, Image, InfoButton, Paragraph, Stack, XStack, YStack } from '@package/ui'
import { useRouter } from 'expo-router'
import { DualResponseButtons, useHaptics, useWizard } from 'packages/app/src'
import { formatRelativeDate } from 'packages/utils/src'

interface VerifyPartySlideProps {
  type: 'offer' | 'request'
  host?: string
  name?: string
  entityId: string
  logo?: DisplayImage
  backgroundColor?: string
  lastInteractionDate?: string
  approvalsCount?: number
}

export const VerifyPartySlide = ({
  type,
  entityId,
  name,
  logo,
  backgroundColor,
  lastInteractionDate,
  approvalsCount,
}: VerifyPartySlideProps) => {
  const router = useRouter()
  const { onNext, onCancel } = useWizard()
  const { withHaptics } = useHaptics()

  const onPressVerifiedIssuer = withHaptics(() => {
    router.push(`/issuer?entityId=${entityId}`)
  })

  const onPressInteraction = withHaptics(() => {
    router.push(`/activity?entityId=${entityId}`)
  })

  return (
    <YStack fg={1} jc="space-between">
      <YStack gap="$6">
        <YStack gap="$4">
          <XStack ai="center" pt="$4" jc="center">
            <Circle size={88} bw="$0.5" borderColor="$grey-100" bg={backgroundColor ?? '$white'}>
              {logo?.url ? (
                <Image circle src={logo.url} alt={logo.altText} width="100%" height="100%" resizeMode="contain" />
              ) : (
                <HeroIcons.BuildingOffice color="$grey-800" size={36} />
              )}
            </Circle>
          </XStack>
          <Stack gap="$2">
            <Heading variant="h2" numberOfLines={2} center fontSize={24}>
              {name ? `Interact with ${name}?` : 'Organization not verified'}
            </Heading>
            {type === 'offer' ? (
              <Paragraph center px="$4">
                {name ? `${name} wants to offer you a card.` : 'An unknown organization wants to offer you a card.'}
              </Paragraph>
            ) : (
              <Paragraph center px="$4">
                {name
                  ? `${name} wants to request information from you.`
                  : 'An unknown organization wants to request information from you.'}
              </Paragraph>
            )}
          </Stack>
        </YStack>

        <YStack gap="$4">
          {approvalsCount ? (
            <InfoButton
              variant="positive"
              title="Verified organisation"
              description={`Approved by ${approvalsCount} organisations`}
              onPress={onPressVerifiedIssuer}
            />
          ) : (
            <InfoButton variant="unknown" title="Unverified organization" description="No trust approvals found" />
          )}
          <InfoButton
            variant={lastInteractionDate ? 'interaction-success' : 'interaction-new'}
            title={lastInteractionDate ? 'Previous interactions' : 'First time interaction'}
            description={
              lastInteractionDate
                ? `Last interaction: ${formatRelativeDate(new Date(lastInteractionDate))}`
                : 'No previous interactions found'
            }
            onPress={lastInteractionDate ? onPressInteraction : undefined}
          />
        </YStack>
      </YStack>
      <Stack btw={1} borderColor="$grey-100" p="$4" mx="$-4">
        <DualResponseButtons
          align="horizontal"
          onAccept={() => onNext()}
          onDecline={() => onCancel()}
          acceptText="Yes, continue"
          declineText="Stop"
        />
      </Stack>
    </YStack>
  )
}
