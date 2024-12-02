import { Button, FlexPage, Heading, HeroIcons, Paragraph, ScrollView, Stack, XStack, YStack } from '@package/ui'
import React from 'react'
import { useRouter } from 'solito/router'
import { Label, Switch } from 'tamagui'

import { useScrollViewPosition } from '@package/app/src/hooks'
import { useDevelopmentMode } from '../../hooks/useDevelopmentMode'

export function FunkeSettingsScreen() {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const router = useRouter()
  const [isDevelpomentModeEnabled, setIsDevelopmentModeEnabled] = useDevelopmentMode()

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <YStack w="100%" top={0} borderBottomWidth="$0.5" borderColor={isScrolledByOffset ? '$grey-200' : '$background'}>
        <YStack gap="$4" p="$4">
          <Stack h="$1" />
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
          <YStack>
            <Paragraph color="$grey-700" py="$4">
              This page is under construction. More options will be added.
            </Paragraph>
            <XStack jc="space-between" ai="center">
              <Label>Development Mode</Label>
              <Switch
                size="$5"
                checked={isDevelpomentModeEnabled}
                onCheckedChange={setIsDevelopmentModeEnabled}
                animation="quick"
                backgroundColor={isDevelpomentModeEnabled ? '$primary-500' : '$primary-300'}
              >
                <Switch.Thumb animation="quick" backgroundColor="$grey-200" />
              </Switch>
            </XStack>
          </YStack>
          <Button.Text color="$primary-500" fontWeight="$semiBold" fontSize="$4" onPress={() => router.back()}>
            <HeroIcons.ArrowLeft mr={-4} color="$primary-500" size={20} /> Back
          </Button.Text>
        </YStack>
      </ScrollView>
    </FlexPage>
  )
}
