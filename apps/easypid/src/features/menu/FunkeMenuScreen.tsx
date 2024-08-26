import { Button, FlexPage, Heading, HeroIcons, Paragraph, ScrollView, Stack, XStack, YStack } from '@package/ui'
import React from 'react'
import { useRouter } from 'solito/router'

import { useScrollViewPosition } from '@package/app/src/hooks'

import { useSecureUnlock } from '@easypid/agent'
import { Link } from 'expo-router'
import { Alert } from 'react-native'
import { resetWallet } from '../../utils/resetWallet'

const menuItems = [
  {
    title: 'Activity',
    icon: HeroIcons.Activity,
    href: '/(menu)/activity',
  },
  {
    title: 'Settings',
    icon: HeroIcons.Settings,
    href: '/(menu)/settings',
  },
  {
    title: 'Feedback',
    icon: HeroIcons.Feedback,
    href: '/(menu)/feedback',
  },
  {
    title: 'About the wallet',
    icon: HeroIcons.InformationCircle,
    href: '/(menu)/about',
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
          resetWallet(secureUnlock)
          router.replace('/onboarding')
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
              <Link href={item.href} key={item.title} asChild>
                <XStack
                  jc="space-between"
                  gap="$4"
                  key={item.title}
                  py="$5"
                  px="$4"
                  borderBottomWidth={idx === menuItems.length - 1 ? 0 : 0.5}
                  borderColor="$grey-300"
                  pressStyle={{
                    backgroundColor: '$grey-100',
                  }}
                >
                  <XStack gap="$4">
                    <Stack>
                      <item.icon color="$grey-900" />
                    </Stack>
                    <Paragraph>{item.title}</Paragraph>
                  </XStack>
                  <HeroIcons.ChevronRight color="$primary-500" size={20} />
                </XStack>
              </Link>
            ))}
          </YStack>
          <YStack px="$4">
            <Button.Solid onPress={onResetWallet}>Reset Wallet</Button.Solid>
          </YStack>
        </YStack>
      </ScrollView>
    </FlexPage>
  )
}
