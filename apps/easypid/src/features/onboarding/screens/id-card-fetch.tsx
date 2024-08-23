import { Button, HeroIcons, IdCard, Stack, YStack } from '@package/ui'
import React from 'react'
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated'

import germanIssuerImage from '../../../../assets/german-issuer-image.png'

export interface OnboardingIdCardFetchProps {
  goToNextStep: () => void
  userName?: string
}

export function OnboardingIdCardFetch({ goToNextStep, userName }: OnboardingIdCardFetchProps) {
  return (
    <YStack justifyContent="space-between" flex-1>
      <IdCard
        icon={userName ? 'complete' : 'loading'}
        hideUserName={!userName}
        issuerImage={germanIssuerImage}
        userName={userName}
      />
      <Stack>
        {userName && (
          <Animated.View entering={FadeIn} layout={LinearTransition}>
            <Button.Solid onPress={goToNextStep}>
              Go to wallet <HeroIcons.ArrowRight size={20} color="$white" />
            </Button.Solid>
          </Animated.View>
        )}
      </Stack>
    </YStack>
  )
}
