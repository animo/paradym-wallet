import { Button, Heading, ScrollView, Spacer, YStack } from '@package/ui'
import React from 'react'
import { useRouter } from 'solito/router'

import { useScrollViewPosition } from '@package/app/src/hooks'

import { useSecureUnlock } from '@easypid/agent'
import { Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { resetWallet } from '../../utils/resetWallet'

export function FunkeMenuScreen() {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const secureUnlock = useSecureUnlock()
  const router = useRouter()
  const { bottom } = useSafeAreaInsets()

  const onResetWallet = () => {
    Alert.alert('Reset Wallet', 'Are you sure you want to reset the wallet?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Yes',
        onPress: () => {
          resetWallet(secureUnlock)
          router.replace('/onboarding')
        },
      },
    ])
  }

  return (
    <YStack bg="$background" height="100%">
      {/* This is the header where the scroll view get's behind. We have the same content in the scrollview, but you
       * don't see that content. It's just so we can make the scrollview minheight 100%.  */}
      <YStack zIndex={2} w="100%" top={0} position="absolute">
        <Spacer size="$13" w="100%" backgroundColor="$background" />
        <YStack borderWidth={0.5} borderColor={isScrolledByOffset ? '$grey-300' : '$background'} />
      </YStack>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={{ minHeight: '100%' }}
      >
        <Spacer size="$13" />
        <YStack borderWidth={0.5} borderColor="$background" />
        <YStack gap="$6" p="$4" flex-1 justifyContent="space-between" paddingBottom={bottom}>
          <YStack gap="$6">
            <Heading variant="title" fontWeight="$bold">
              Menu
            </Heading>
          </YStack>
          <Button.Solid onPress={onResetWallet}>Reset Wallet</Button.Solid>
        </YStack>
      </ScrollView>
    </YStack>
  )
}
