import type React from 'react'

import { useHaptics, useScrollViewPosition } from '@package/app/src/hooks'
import {
  AnimatedStack,
  Button,
  FlexPage,
  HeaderContainer,
  Heading,
  HeroIcons,
  MessageBox,
  ScrollView,
  Stack,
  XStack,
  YStack,
  useScaleAnimation,
} from '@package/ui'

import { usePidCredential } from '@easypid/hooks'
import { useWalletReset } from '@easypid/hooks/useWalletReset'
import { TextBackButton } from '@package/app'
import { Link, router } from 'expo-router'
import { cloneElement } from 'react'
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

// Create new menu item component
// with props:
// - variant: 'default' | 'danger'
// - onPress
// - icon
// - label

type MenuListItemProps = {
  variant?: 'default' | 'danger'
  onPress: () => void
  icon: React.ReactElement
  label: string
  action?: 'outside' | 'info' | 'route' | 'none'
}

export const MenuListItem = ({ variant = 'default', onPress, icon, label, action = 'route' }: MenuListItemProps) => {
  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation()
  const { withHaptics } = useHaptics()

  return (
    <AnimatedStack
      style={pressStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={withHaptics(onPress)}
      flexDirection="row"
      ai="center"
      jc="space-between"
      gap="$4"
      px="$4"
      py="$2"
    >
      <XStack ai="center" gap="$4">
        <Stack p="$3" bg={variant === 'default' ? '$grey-50' : '$danger-300'} br="$6">
          {cloneElement(icon, { color: variant === 'default' ? '$grey-900' : '$danger-600' })}
        </Stack>
        <Heading variant="h3" fontWeight="$semiBold" color={variant === 'default' ? '$grey-900' : '$danger-600'}>
          {label}
        </Heading>
      </XStack>
      {action === 'route' && <HeroIcons.ChevronRight color="$grey-500" />}
      {action === 'info' && <HeroIcons.InformationCircleFilled color="$grey-500" />}
      {action === 'outside' && <HeroIcons.ArrowUpRightFilled color="$grey-500" />}
    </AnimatedStack>
  )
}
export function FunkeMenuScreen() {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const onResetWallet = useWalletReset()
  const { credential } = usePidCredential()

  const idItem = credential ? (
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

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <HeaderContainer isScrolledByOffset={isScrolledByOffset} title="Menu" />
      <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack fg={1} gap="$6" jc="space-between">
          {!credential && (
            <Stack px="$4">
              <MessageBox
                variant="info"
                icon={<HeroIcons.ArrowRight />}
                title="Setup digital ID"
                message="Use your eID card to set up your digital identity."
                onPress={() => router.push('/pidSetup')}
              />
            </Stack>
          )}
          <YStack gap="$3">
            <Heading px="$4" variant="sub2" fontWeight="$semiBold">
              WALLET
            </Heading>
            <YStack>
              <MenuListItem onPress={() => undefined} icon={<HeroIcons.CreditCardFilled />} label="Cards" />
              <MenuListItem onPress={() => undefined} icon={<HeroIcons.QueueListFilled />} label="Activity" />
            </YStack>
          </YStack>
          <YStack gap="$3">
            <Heading px="$4" variant="sub2" fontWeight="$semiBold">
              APP
            </Heading>
            <YStack>
              <MenuListItem onPress={() => undefined} icon={<HeroIcons.Cog8ToothFilled />} label="Settings" />
              <MenuListItem
                onPress={() => undefined}
                icon={<HeroIcons.ChatBubbleBottomCenterTextFilled />}
                label="Feedback"
                action="outside"
              />
              <MenuListItem
                onPress={() => undefined}
                icon={<HeroIcons.InformationCircleFilled />}
                label="About the wallet"
                action="none"
              />
              <MenuListItem
                variant="danger"
                onPress={() => undefined}
                icon={<HeroIcons.TrashFilled />}
                label="Reset wallet"
                action="none"
              />
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
