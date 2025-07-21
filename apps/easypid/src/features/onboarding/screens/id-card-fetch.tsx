import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Button, HeroIcons, IdCard, Stack, YStack } from '@package/ui'
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated'

export interface OnboardingIdCardFetchProps {
  goToNextStep: () => void
  userName?: string
}

export function OnboardingIdCardFetch({ goToNextStep, userName }: OnboardingIdCardFetchProps) {
  const { t } = useLingui()

  return (
    <YStack justifyContent="space-between" flex-1>
      <IdCard icon={userName ? 'complete' : 'loading'} hideUserName={!userName} userName={userName} />
      <Stack>
        {userName && (
          <Animated.View entering={FadeIn} layout={LinearTransition}>
            <Button.Solid scaleOnPress onPress={goToNextStep}>
              {t(commonMessages.goToWallet)} <HeroIcons.ArrowRight size={20} color="$white" />
            </Button.Solid>
          </Animated.View>
        )}
      </Stack>
    </YStack>
  )
}
