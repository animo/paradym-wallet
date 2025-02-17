import React from 'react'

import { useHaptics, useScrollViewPosition } from '@package/app/src/hooks'
import {
  Button,
  FlexPage,
  HeaderContainer,
  Heading,
  HeroIcons,
  ScrollView,
  Stack,
  XStack,
  YStack,
  useScaleAnimation,
} from '@package/ui'

import { useCredentialByCategory } from '@easypid/hooks/useCredentialByCategory'
import { useFeatureFlag } from '@easypid/hooks/useFeatureFlag'
import { useWalletReset } from '@easypid/hooks/useWalletReset'
import { TextBackButton } from '@package/app'
import { Link } from 'expo-router'
import { Linking } from 'react-native'
import Animated from 'react-native-reanimated'

const menuItems = [
  {
    title: 'Cards',
    icon: HeroIcons.CreditCardFilled,
    href: '/credentials',
  },
  {
    title: 'Activity',
    icon: HeroIcons.QueueListFilled,
    href: '/activity',
  },
  {
    title: 'Settings',
    icon: HeroIcons.Cog8ToothFilled,
    href: 'menu/settings',
  },
  {
    title: 'Feedback',
    icon: HeroIcons.ChatBubbleBottomCenterTextFilled,
    href: 'menu/feedback',
  },
  {
    title: 'About the wallet',
    icon: HeroIcons.InformationCircleFilled,
    href: 'menu/about',
  },
]

export function FunkeMenuScreen() {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const onResetWallet = useWalletReset()
  const { credential } = useCredentialByCategory('DE_PID')
  const hasEidCardFeatureFlag = useFeatureFlag('EID_CARD')

  const idItem = hasEidCardFeatureFlag ? (
    credential ? (
      <MenuItem
        key="id"
        item={{
          href: `credentials/${credential.id}`,
          icon: HeroIcons.IdentificationFilled,
          title: 'Your digital ID',
        }}
        idx={0}
      />
    ) : (
      <MenuItem
        key="id"
        item={{
          href: '/pidSetup',
          icon: HeroIcons.IdentificationFilled,
          title: 'Setup digital ID',
        }}
        idx={0}
      />
    )
  ) : null

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <HeaderContainer isScrolledByOffset={isScrolledByOffset} title="Menu" />
      <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack fg={1} jc="space-between">
          <YStack>
            {idItem}
            {menuItems.map((item, idx) => (
              <MenuItem key={item.title} item={item} idx={idx} />
            ))}
            <YStack py="$4" ai="center">
              <YStack px="$4" w="60%">
                <Button.Solid
                  accessible={true}
                  accessibilityRole="button"
                  aria-label="Reset wallet"
                  scaleOnPress
                  onPress={onResetWallet}
                >
                  Reset wallet
                </Button.Solid>
              </YStack>
            </YStack>
          </YStack>
        </YStack>
      </ScrollView>
      <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
        <TextBackButton />
      </YStack>
    </FlexPage>
  )
}

const MenuItem = ({ item, idx, onPress }: { item: (typeof menuItems)[number]; idx: number; onPress?: () => void }) => {
  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation()
  const { withHaptics } = useHaptics()

  const content = (
    <XStack
      jc="space-between"
      gap="$4"
      key={item.title}
      py="$5"
      mx="$4"
      borderBottomWidth={idx === menuItems.length - 1 ? 0 : '$0.5'}
      borderColor="$grey-200"
      accessible={true}
      accessibilityRole="button"
      aria-label={item.title}
    >
      <Animated.View style={pressStyle}>
        <XStack jc="space-between" w="100%">
          <XStack gap="$4" ai="center">
            <Stack>
              <item.icon color="$primary-500" />
            </Stack>
            <Heading variant="h3" fontWeight="$semiBold">
              {item.title}
            </Heading>
          </XStack>
          <HeroIcons.ChevronRight color="$primary-500" size={20} />
        </XStack>
      </Animated.View>
    </XStack>
  )

  // Temporary placeholder for the feedback screen
  if (item.href === 'menu/feedback') {
    return (
      <Stack
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={withHaptics(() => Linking.openURL('mailto:ana@animo.id?subject=Feedback on the Wallet'))}
        asChild
      >
        {content}
      </Stack>
    )
  }

  if (item.href === '/') {
    return (
      <Stack onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={withHaptics(() => onPress)}>
        {content}
      </Stack>
    )
  }

  return (
    <Link
      onPress={withHaptics(() => undefined)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      href={item.href}
      asChild
    >
      {content}
    </Link>
  )
}
