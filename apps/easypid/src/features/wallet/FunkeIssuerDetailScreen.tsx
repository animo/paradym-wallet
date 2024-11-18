import { getOpenIdFedIssuerMetadata } from '@easypid/utils/issuer'
import {
  Circle,
  FlexPage,
  Heading,
  HeroIcons,
  Image,
  MessageBox,
  Paragraph,
  ScrollView,
  type ScrollViewRefType,
  Stack,
  XStack,
  YStack,
  useToastController,
} from '@package/ui'
import { useRouter } from 'expo-router'
import { TextBackButton, useHaptics, useScrollViewPosition } from 'packages/app/src'
import { useRef } from 'react'
import { Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface FunkeIssuerDetailScreenProps {
  host: string
}

export function FunkeIssuerDetailScreen({ host }: FunkeIssuerDetailScreenProps) {
  const toast = useToastController()
  const router = useRouter()
  const { withHaptics, errorHaptic } = useHaptics()
  const data = getOpenIdFedIssuerMetadata(host)

  if (!data) {
    router.back()
    errorHaptic()
    return toast.show('Currently unavailable.', {
      customData: {
        preset: 'warning',
      },
    })
  }

  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { bottom } = useSafeAreaInsets()
  const scrollViewRef = useRef<ScrollViewRefType>(null)

  const openDomain = withHaptics(() => {
    Linking.openURL(`https://${host}`)
  })

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <YStack
        w="100%"
        top={0}
        p="$4"
        borderBottomWidth="$0.5"
        borderColor={isScrolledByOffset ? '$grey-200' : '$background'}
      />
      <ScrollView ref={scrollViewRef} onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack gap="$4" p="$4" marginBottom={bottom}>
          <Heading variant="h1">About this party</Heading>
          <MessageBox
            variant="light"
            message="Always consider whether sharing with a party is wise."
            icon={<HeroIcons.ExclamationTriangleFilled />}
          />
          <XStack gap="$4" pt="$2">
            <Circle overflow="hidden" size="$5" bg="$grey-100">
              <Image src={data.display.logo.url} height="100%" width="100%" />
            </Circle>
            <YStack>
              <Heading variant="h2">{data.display.name}</Heading>
              <Paragraph onPress={openDomain} fontWeight="$medium" color="$primary-500">
                {host}
              </Paragraph>
            </YStack>
          </XStack>
          <YStack gap="$4" py="$2">
            <YStack gap="$2">
              <Heading variant="sub2">Approvals</Heading>
              <Paragraph>A list of entities that have approved {data.display.name}.</Paragraph>
            </YStack>
            <YStack gap="$2">
              {data.approvals.map((approval) => (
                <XStack
                  ai="center"
                  key={approval.id}
                  br="$8"
                  p="$3.5"
                  gap="$3"
                  bw="$0.5"
                  borderColor="$grey-200"
                  bg="$white"
                >
                  <Circle overflow="hidden" size="$4" bg="$grey-50">
                    <Image src={approval.ownedBy.display.logo.url} height="100%" width="100%" />
                  </Circle>
                  <YStack gap="$1" f={1}>
                    <Heading variant="h3">{approval.name}</Heading>
                    <Paragraph fontSize={15}>Owned by {approval.ownedBy.display.name}</Paragraph>
                  </YStack>
                </XStack>
              ))}
            </YStack>
          </YStack>
          <YStack gap="$4" py="$2">
            <YStack gap="$2">
              <Heading variant="sub2">Trust marks</Heading>
              <Paragraph>Certifications that verify {data.display.name}'s security and quality standards.</Paragraph>
            </YStack>
            <XStack flexWrap="wrap" gap="$2">
              {data.certifications.map((certification) => (
                <Stack key={certification} br="$12" p="$2" px="$4" bg="$grey-100">
                  <Paragraph fontWeight="$medium">{certification}</Paragraph>
                </Stack>
              ))}
            </XStack>
          </YStack>
        </YStack>
      </ScrollView>
      <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
        <TextBackButton />
      </YStack>
    </FlexPage>
  )
}
