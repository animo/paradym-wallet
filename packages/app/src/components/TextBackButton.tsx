import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Button, HeroIcons, useMedia, YStack } from '@package/ui'
import { useRouter } from 'expo-router'
import { useHaptics } from '../hooks'

export function TextBackButton() {
  const router = useRouter()
  const { withHaptics } = useHaptics()
  const { t } = useLingui()

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.dismissTo('/')
    }
  }

  return (
    <Button.Text h="11" color="primary-500" fontWeight="semiBold" onPress={withHaptics(handleBack)} scaleOnPress>
      <HeroIcons.ArrowLeft mr={-4} color="primary-500" strokeWidth={2} size={20} /> {t(commonMessages.backButton)}
    </Button.Text>
  )
}

/**
 * A bar at the bottom of the screen with the back button. Wide windows leave it out: the header already has a back
 * button, and in landscape the height is better spent on content.
 */
export function BackFooter() {
  const media = useMedia()
  if (media.wide) return null

  return (
    <YStack borderTopWidth="1" borderColor="grey-200" pt="1" mx="-5" px="5" bg="background">
      <TextBackButton />
    </YStack>
  )
}
