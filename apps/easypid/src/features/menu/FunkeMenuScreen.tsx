import { useFeatureFlag } from '@easypid/hooks/useFeatureFlag'
import { useWalletReset } from '@easypid/hooks/useWalletReset'
import { useLingui } from '@lingui/react/macro'
import { useCredentialByCategory } from '@package/agent/hooks/useCredentialByCategory'
import { TextBackButton } from '@package/app'
import { useHaptics, useScrollViewPosition } from '@package/app/hooks'
import { commonMessages } from '@package/translations'
import {
  AnimatedStack,
  FlexPage,
  HeaderContainer,
  Heading,
  HeroIcons,
  IconContainer,
  type IconContainerProps,
  MessageBox,
  ScrollView,
  Stack,
  useScaleAnimation,
  XStack,
  YStack,
} from '@package/ui'
import { router } from 'expo-router'
import { Linking } from 'react-native'

type MenuListItemProps = {
  variant?: 'regular' | 'danger'
  onPress: () => void
  icon: IconContainerProps['icon']
  label: string
  action?: 'outside' | 'info' | 'route' | 'none'
}

const MenuListItem = ({ variant = 'regular', onPress, icon, label, action = 'route' }: MenuListItemProps) => {
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
        <Heading heading="h3" fontWeight="$semiBold" color={variant === 'regular' ? '$grey-900' : '$danger-600'}>
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
  const { t } = useLingui()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const onResetWallet = useWalletReset()
  const { withHaptics } = useHaptics()
  const { credential, isLoading } = useCredentialByCategory('DE-PID')
  const hasEidCardFeatureFlag = useFeatureFlag('EID_CARD')

  const handleFeedback = withHaptics(() => Linking.openURL('mailto:ana@animo.id?subject=Feedback on the Wallet'))
  const handlePush = (path: string) => withHaptics(() => router.push(path))

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <HeaderContainer
        isScrolledByOffset={isScrolledByOffset}
        title={t({
          id: 'menu.title',
          message: 'Menu',
          comment: 'Title of the menu screen',
        })}
      />
      <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack fg={1} gap="$6" jc="space-between">
          {!credential && !isLoading && hasEidCardFeatureFlag ? (
            <Stack px="$4">
              <MessageBox
                variant="info"
                icon={<HeroIcons.ArrowRight />}
                title={t({
                  id: 'menu.setupEid.title',
                  message: 'Setup digital ID',
                  comment: 'Title for the eID setup prompt',
                })}
                message={t({
                  id: 'menu.setupEid.message',
                  message: 'Use your eID card to set up your digital identity.',
                  comment: 'Explanation for setting up eID card',
                })}
                onPress={handlePush('/pidSetup')}
              />
            </Stack>
          ) : (
            <Stack my="$-3" />
          )}

          <YStack gap="$3">
            <Heading px="$4" heading="sub2" fontWeight="$semiBold">
              {t({
                id: 'menu.section.wallet',
                message: 'WALLET',
                comment: 'Heading above the wallet section',
              })}
            </Heading>
            <YStack>
              <MenuListItem
                onPress={handlePush('/credentials')}
                icon={<HeroIcons.CreditCardFilled />}
                label={t({
                  id: 'menu.item.cards',
                  message: 'Cards',
                  comment: 'Label for the credentials menu item',
                })}
              />
              <MenuListItem
                onPress={handlePush('/activity')}
                icon={<HeroIcons.QueueListFilled />}
                label={t({
                  id: 'menu.item.activity',
                  message: 'Activity',
                  comment: 'Label for activity log',
                })}
              />
            </YStack>
          </YStack>

          <YStack gap="$3">
            <Heading px="$4" heading="sub2" fontWeight="$semiBold">
              {t({
                id: 'menu.section.app',
                message: 'APP',
                comment: 'Heading above the app section',
              })}
            </Heading>
            <YStack>
              <MenuListItem
                onPress={handlePush('/menu/settings')}
                icon={<HeroIcons.Cog8ToothFilled />}
                label={t({
                  id: 'menu.item.settings',
                  message: 'Settings',
                  comment: 'Label for settings menu item',
                })}
              />
              <MenuListItem
                onPress={handleFeedback}
                icon={<HeroIcons.ChatBubbleBottomCenterTextFilled />}
                label={t({
                  id: 'menu.item.feedback',
                  message: 'Feedback',
                  comment: 'Label for feedback menu item',
                })}
                action="outside"
              />
              <MenuListItem
                onPress={handlePush('/menu/about')}
                icon={<HeroIcons.InformationCircleFilled />}
                label={t({
                  id: 'menu.item.about',
                  message: 'About this wallet',
                  comment: 'Label for about screen menu item',
                })}
              />
              <MenuListItem
                variant="danger"
                onPress={onResetWallet}
                icon={<HeroIcons.TrashFilled />}
                label={t(commonMessages.reset)}
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
