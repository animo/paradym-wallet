import { FlexPage, HeaderContainer, HeroIcons, ScrollView, Switch, YStack } from '@package/ui'

import { TextBackButton } from '@package/app'
import { LocalAiContainer } from './components/LocalAiContainer'

import { useFeatureFlag } from '@easypid/hooks/useFeatureFlag'
import { useScrollViewPosition } from '@package/app/hooks'
import { useDevelopmentMode } from '../../hooks/useDevelopmentMode'

export function FunkeSettingsScreen() {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const [isDevelopmentModeEnabled, setIsDevelopmentModeEnabled] = useDevelopmentMode()
  const isOverAskingAiEnabled = useFeatureFlag('AI_ANALYSIS')

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <HeaderContainer title="Settings" isScrolledByOffset={isScrolledByOffset} />
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={{ flexGrow: 1 }}
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
