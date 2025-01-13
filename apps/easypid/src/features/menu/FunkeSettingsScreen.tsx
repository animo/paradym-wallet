import { FlexPage, Heading, HeroIcons, ScrollView, Stack, Switch, YStack } from '@package/ui'
import React from 'react'

import { TextBackButton } from 'packages/app/src'
import { LocalAiContainer } from './components/LocalAiContainer'

import { useFeatureFlag } from '@easypid/hooks/useFeatureFlag'
import { useScrollViewPosition } from '@package/app/src/hooks'
import { useDevelopmentMode } from '../../hooks/useDevelopmentMode'

export function FunkeSettingsScreen() {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const [isDevelopmentModeEnabled, setIsDevelopmentModeEnabled] = useDevelopmentMode()
  const isOverAskingAiEnabled = useFeatureFlag('AI_ANALYSIS')

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <YStack w="100%" top={0} borderBottomWidth="$0.5" borderColor={isScrolledByOffset ? '$grey-200' : '$background'}>
        <YStack p="$4" gap="$2">
          <Stack h="$2" />
          <Heading variant="h1" fontWeight="$bold">
            Settings
          </Heading>
        </YStack>
      </YStack>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={{ minHeight: '85%' }}
      >
        <YStack fg={1} px="$4" jc="space-between">
          <YStack gap="$4" py="$2">
            <Switch
              id="development-mode"
              label="Development Mode"
              icon={<HeroIcons.CommandLineFilled />}
              value={isDevelopmentModeEnabled ?? false}
              onChange={setIsDevelopmentModeEnabled}
            />
            {isOverAskingAiEnabled && <LocalAiContainer />}
          </YStack>
          <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
            <TextBackButton />
          </YStack>
        </YStack>
      </ScrollView>
    </FlexPage>
  )
}
