import type { DisplayImage } from '@package/agent'

import { Heading, HeroIcons, Image, Paragraph, Stack, XStack, YStack } from '@package/ui'
import { DualResponseButtons, useWizard } from 'packages/app/src'
import { Linking } from 'react-native'

interface VerifyPartySlideProps {
  name?: string
  domain?: string
  logo?: DisplayImage
}

export const VerifyPartySlide = ({ name, domain, logo }: VerifyPartySlideProps) => {
  const { onNext, onCancel } = useWizard()

  if (name && domain) {
    const openUrl = () => {
      Linking.openURL(`https://${domain}`)
    }

    return (
      <YStack fg={1} jc="space-between">
        <YStack gap="$6">
          <Heading>Do you recognize {name}?</Heading>
          <Stack gap="$4">
            <Stack alignSelf="flex-start">
              <XStack pos="relative">
                {logo?.url ? (
                  <YStack br="$4" overflow="hidden" height={72} width={72} bg="$grey-900">
                    <Image src={logo.url} alt={logo.altText} width="100%" height="100%" resizeMode="cover" />
                  </YStack>
                ) : (
                  <XStack p="$4" bg="$grey-100" borderRadius="$4">
                    <HeroIcons.BuildingOffice color="$grey-800" size={32} />
                  </XStack>
                )}
                <Stack pos="absolute" top="$-2" right="$-2">
                  <Stack bg="$positive-500" br="$12" p="$1.5">
                    <HeroIcons.ShieldCheckFilled strokeWidth={2} color="$white" size={16} />
                  </Stack>
                </Stack>
              </XStack>
            </Stack>
            <Paragraph>
              Watch out for fraud. Only continue if the QR-code is on{' '}
              <Paragraph onPress={openUrl} fontWeight="$semiBold" color="$primary-500">
                {domain}
              </Paragraph>
              .
            </Paragraph>
          </Stack>
        </YStack>
        <Stack btw={1} borderColor="$grey-100" pt="$4" mx="$-4" px="$4">
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

  return (
    <YStack fg={1} jc="space-between">
      <YStack gap="$6">
        <Heading>This is an unknown party, do you want to continue?</Heading>
        <Stack gap="$4">
          <Stack alignSelf="flex-start">
            <XStack pos="relative">
              <XStack p="$4" bg="$grey-100" borderRadius="$4">
                <HeroIcons.BuildingOffice color="$grey-800" size={32} />
              </XStack>
              <Stack pos="absolute" top="$-2" right="$-2">
                <HeroIcons.ExclamationCircleFilled color="$grey-700" />
              </Stack>
            </XStack>
          </Stack>
          <Paragraph>
            There is little or no data found about this party. Are you sure you want to share with this party?
          </Paragraph>
        </Stack>
      </YStack>
      <Stack borderTopWidth="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4">
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
