import { useActivities } from '@easypid/features/activity/activityRecord'
import { getOpenIdFedIssuerMetadata } from '@easypid/utils/issuer'
import type { DisplayImage } from '@package/agent'

import { Circle, Heading, HeroIcons, Image, InfoButton, Paragraph, Stack, XStack, YStack } from '@package/ui'
import { useRouter } from 'expo-router'
import { DualResponseButtons, useHaptics, useWizard } from 'packages/app/src'
import { formatRelativeDate } from 'packages/utils/src'

interface VerifyPartySlideProps {
  domain: string
  name?: string
  logo?: DisplayImage
  backgroundColor?: string
}

export const VerifyPartySlide = ({ domain, name, logo, backgroundColor }: VerifyPartySlideProps) => {
  const router = useRouter()
  const { onNext, onCancel } = useWizard()
  const { activities } = useActivities()
  const { withHaptics } = useHaptics()

  const lastInteraction = activities.find((activity) => activity.entity.host === domain)

  const fedDisplayData = getOpenIdFedIssuerMetadata(domain)
  if (fedDisplayData) {
    name = fedDisplayData.display.name
    logo = fedDisplayData.display.logo
  }

  const onPressVerifiedIssuer = withHaptics(() => {
    router.push(`/issuer?domain=${domain}`)
  })

  const onPressInteraction = withHaptics(() => {
    router.push(`/activity?host=${domain}`)
  })

  return (
    <YStack fg={1} jc="space-between">
      <YStack gap="$6">
        <YStack gap="$4">
          <XStack ai="center" pt="$4" jc="center">
            <Circle size={88} bw="$0.5" borderColor="$grey-100" bg={backgroundColor ?? '$grey-50'}>
              {logo?.url ? (
                <Image circle src={logo.url} alt={logo.altText} width="100%" height="100%" resizeMode="cover" />
              ) : (
                <HeroIcons.BuildingOffice color="$grey-800" size={36} />
              )}
            </Circle>
          </XStack>
          <Stack gap="$2">
            <Heading variant="h2" numberOfLines={2} center fontSize={24}>
              Interact with {name}?
            </Heading>
            <Paragraph center px="$4">
              {name} want’s to request information from your credentials.
            </Paragraph>
          </Stack>
        </YStack>

        <YStack gap="$4">
          {fedDisplayData ? (
            <InfoButton
              variant="positive"
              title="Verified organisation"
              description={`Approved by ${fedDisplayData.approvals.length} organisations`}
              onPress={onPressVerifiedIssuer}
            />
          ) : (
            <InfoButton variant="unknown" title="Unverified organization" description="No approvals found" />
          )}
          <InfoButton
            variant={lastInteraction ? 'interaction-success' : 'interaction-new'}
            title={lastInteraction ? 'Previous interactions' : 'First time interaction'}
            description={
              lastInteraction
                ? `Last interaction: ${formatRelativeDate(new Date(lastInteraction.date))}`
                : 'No previous interactions found'
            }
            onPress={lastInteraction ? onPressInteraction : undefined}
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
