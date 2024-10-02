import { Button, FlexPage, Heading, HeroIcons, ScrollView, Stack, XStack, YStack, useScaleAnimation } from '@package/ui'
import React from 'react'

import { useScrollViewPosition } from '@package/app/src/hooks'

import { usePidCredential } from '@easypid/hooks'
import { useWalletReset } from '@easypid/hooks/useWalletReset'
import { TextBackButton } from '@package/app'
import { Link } from 'expo-router'
import Animated from 'react-native-reanimated'

const menuItems = [
  {
    title: 'Activity',
    icon: HeroIcons.Activity,
    href: '/activity',
  },
  {
    title: 'Settings',
    icon: HeroIcons.Settings,
    href: 'menu/settings',
  },
  {
    title: 'Feedback',
    icon: HeroIcons.Feedback,
    href: 'menu/feedback',
  },
  {
    title: 'About the wallet',
    icon: HeroIcons.InformationCircle,
    href: 'menu/about',
  },
]

export function FunkeMenuScreen() {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const onResetWallet = useWalletReset()
  const { credential } = usePidCredential()

  const idItem = credential ? (
    <MenuItem
      key="id"
      item={{
        href: 'credentials/pid',
        icon: HeroIcons.Identification,
        title: 'Your digital ID',
      }}
      idx={0}
    />
  ) : (
    <MenuItem
      key="id"
      item={{
        href: '/',
        icon: HeroIcons.Identification,
        title: 'Setup digital ID',
      }}
      onClick={onResetWallet}
      idx={0}
    />
  )

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <YStack w="100%" top={0} borderBottomWidth="$0.5" borderColor={isScrolledByOffset ? '$grey-200' : '$background'}>
        <YStack gap="$4" p="$4">
          <Stack h="$1" />
          <Heading variant="h1" fontWeight="$bold">
            Menu
          </Heading>
        </YStack>
      </YStack>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={{ minHeight: '85%' }}
      >
        <YStack fg={1} jc="space-between">
          <YStack>
            {idItem}
            {menuItems.map((item, idx) => (
              <MenuItem key={item.title} item={item} idx={idx} />
            ))}

            <YStack py="$4" ai="center">
              <YStack px="$4" w="60%">
                <Button.Solid scaleOnPress onPress={onResetWallet}>
                  Reset wallet
                </Button.Solid>
              </YStack>
            </YStack>
          </YStack>
        </YStack>
        <TextBackButton />
      </ScrollView>
    </FlexPage>
  )
}

const MenuItem = ({ item, idx, onClick }: { item: (typeof menuItems)[number]; idx: number; onClick?: () => void }) => {
  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation()

  const content = (
    <XStack
      jc="space-between"
      gap="$4"
      key={item.title}
      py="$5"
      mx="$4"
      borderBottomWidth={idx === menuItems.length - 1 ? 0 : '$0.5'}
      borderColor="$grey-200"
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

  if (item.href === '/') {
    return (
      <Stack onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onClick}>
        {content}
      </Stack>
    )
  }

  return (
    <Link onPressIn={handlePressIn} onPressOut={handlePressOut} href={item.href} asChild>
      {content}
    </Link>
  )
}
