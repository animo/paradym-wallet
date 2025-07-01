import type React from 'react'

import { useFeatureFlag } from '@easypid/hooks/useFeatureFlag'
import { useWalletReset } from '@easypid/hooks/useWalletReset'
import { useCredentialByCategory } from '@package/agent/hooks/useCredentialByCategory'
import { TextBackButton } from '@package/app'
import { useHaptics, useScrollViewPosition } from '@package/app/hooks'
import {
  AnimatedStack,
  FlexPage,
  HeaderContainer,
  Heading,
  HeroIcons,
  IconContainer,
  MessageBox,
  ScrollView,
  Stack,
  XStack,
  YStack,
  useScaleAnimation,
} from '@package/ui'
import { router } from 'expo-router'
import { Linking } from 'react-native'

type MenuListItemProps = {
  variant?: 'regular' | 'danger'
  onPress: () => void
  icon: React.ReactElement
  label: string
  action?: 'outside' | 'info' | 'route' | 'none'
}

export const MenuListItem = ({ variant = 'regular', onPress, icon, label, action = 'route' }: MenuListItemProps) => {
  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation()

  return (
    <AnimatedStack
      style={pressStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      flexDirection="row"
      ai="center"
      jc="space-between"
      gap="$4"
      px="$4"
      py="$2"
    >
      <XStack ai="center" gap="$4">
        <IconContainer icon={icon} radius="normal" variant={variant} />
        <Heading variant="h3" fontWeight="$semiBold" color={variant === 'regular' ? '$grey-900' : '$danger-600'}>
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
  const { withHaptics } = useHaptics()

  const { credential, isLoading } = useCredentialByCategory('DE-PID')
  const hasEidCardFeatureFlag = useFeatureFlag('EID_CARD')

  const handleFeedback = withHaptics(() => Linking.openURL('mailto:ana@animo.id?subject=Feedback on the Wallet'))
  const handlePush = (path: string) => withHaptics(() => router.push(path))

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <HeaderContainer isScrolledByOffset={isScrolledByOffset} title="Menu" />
      <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack fg={1} gap="$6" jc="space-between">
          {!credential && !isLoading && hasEidCardFeatureFlag ? (
            <Stack px="$4">
              <MessageBox
                variant="info"
                icon={<HeroIcons.ArrowRight />}
                title="Setup digital ID"
                message="Use your eID card to set up your digital identity."
                onPress={handlePush('/pidSetup')}
              />
            </Stack>
          ) : (
            <Stack my="$-3" />
          )}
          <YStack gap="$3">
            <Heading px="$4" variant="sub2" fontWeight="$semiBold">
              WALLET
            </Heading>
            <YStack>
              <MenuListItem onPress={handlePush('/credentials')} icon={<HeroIcons.CreditCardFilled />} label="Cards" />
              <MenuListItem onPress={handlePush('/activity')} icon={<HeroIcons.QueueListFilled />} label="Activity" />
            </YStack>
          </YStack>
          <YStack gap="$3">
            <Heading px="$4" variant="sub2" fontWeight="$semiBold">
              APP
            </Heading>
            <YStack>
              <MenuListItem
                onPress={handlePush('/menu/settings')}
                icon={<HeroIcons.Cog8ToothFilled />}
                label="Settings"
              />
              <MenuListItem
                onPress={handleFeedback}
                icon={<HeroIcons.ChatBubbleBottomCenterTextFilled />}
                label="Feedback"
                action="outside"
              />
              <MenuListItem
                onPress={handlePush('/menu/about')}
                icon={<HeroIcons.InformationCircleFilled />}
                label="About this wallet"
              />
              <MenuListItem
                variant="danger"
                onPress={onResetWallet}
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
