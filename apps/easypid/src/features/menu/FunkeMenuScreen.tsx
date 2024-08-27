import { Button, FlexPage, Heading, HeroIcons, ScrollView, Stack, XStack, YStack, useScaleAnimation } from '@package/ui'
import React from 'react'

import { useScrollViewPosition } from '@package/app/src/hooks'

import { useSecureUnlock } from '@easypid/agent'
import { resetWallet } from '@easypid/utils/resetWallet'
import { TextBackButton } from '@package/app'
import { Link, useRouter } from 'expo-router'
import { Alert } from 'react-native'
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
  const secureUnlock = useSecureUnlock()
  const router = useRouter()

  const onResetWallet = () => {
    Alert.alert('Reset Wallet', 'Are you sure you want to reset the wallet?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Yes',
        onPress: () => {
          resetWallet(secureUnlock).then(() => router.replace('onboarding'))
        },
      },
    ])
  }

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <YStack w="100%" top={0} borderBottomWidth={0.5} borderColor={isScrolledByOffset ? '$grey-300' : '$background'}>
        <YStack gap="$4" p="$4">
          <Stack h="$1" />
          <Heading variant="title" fontWeight="$bold">
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

const MenuItem = ({ item, idx }: { item: (typeof menuItems)[number]; idx: number }) => {
  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation()

  return (
    <Link href={item.href} key={item.title} asChild>
      <XStack
        jc="space-between"
        gap="$4"
        key={item.title}
        py="$5"
        px="$4"
        borderBottomWidth={idx === menuItems.length - 1 ? 0 : 0.5}
        borderColor="$grey-300"
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
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
    </Link>
  )
}
