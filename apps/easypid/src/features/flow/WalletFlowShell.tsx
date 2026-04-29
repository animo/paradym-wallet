import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import {
  AnimatedStack,
  Button,
  Heading,
  HeroIcons,
  IconContainer,
  Image,
  Paragraph,
  Spinner,
  Stack,
  XStack,
  YStack,
} from '@package/ui'
import type { DisplayImage } from '@paradym/wallet-sdk'
import { type ComponentProps, type ReactNode, useEffect } from 'react'
import { Platform, ScrollView, useWindowDimensions } from 'react-native'
import { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { StackProps } from 'tamagui'

type WalletFlowSurface = 'fullscreen' | 'overlay'
export type WalletFlowSource = 'in-app' | 'external' | 'dc-api'

type WalletFlowShellProps = {
  surface: WalletFlowSurface
  title?: ReactNode
  subtitle?: ReactNode
  logo?: DisplayImage
  logoFallback?: string
  isLoading?: boolean
  children: ReactNode
  footer?: ReactNode
  onCancel?: () => void
}

export function getWalletFlowSurface(source: WalletFlowSource = 'in-app'): WalletFlowSurface {
  return Platform.OS === 'android' && source !== 'in-app' ? 'overlay' : 'fullscreen'
}

function FlowLogo({ logo, fallback }: { logo?: DisplayImage; fallback?: string }) {
  return (
    <YStack
      w={44}
      h={44}
      br="$12"
      bg="white"
      borderWidth={1}
      borderColor="$grey-200"
      shadow
      ai="center"
      jc="center"
      overflow="hidden"
    >
      {logo?.url ? (
        <Image src={logo.url} alt={logo.altText} width={44} height={44} contentFit="cover" circle />
      ) : (
        <Heading heading="h4">{fallback?.slice(0, 1).toLocaleUpperCase() ?? '?'}</Heading>
      )}
    </YStack>
  )
}

export function WalletFlowActionButton({
  children,
  disabled,
  isLoading,
  ...props
}: Omit<ComponentProps<typeof Button.Solid>, 'children'> & {
  children: ReactNode
  isLoading?: boolean
}) {
  return (
    <Button.Solid scaleOnPress disabled={disabled || isLoading} {...props}>
      {isLoading ? <Spinner variant="dark" /> : children}
    </Button.Solid>
  )
}

function FlowSkeletonBlock({ bg = '$grey-100', br = '$4', style, ...props }: StackProps) {
  const pulse = useSharedValue(0)

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) }), -1, true)
  }, [pulse])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: 0.55 + pulse.value * 0.45 }))

  return <AnimatedStack bg={bg} br={br} style={[animatedStyle, style]} {...props} />
}

function FlowSkeleton() {
  return (
    <YStack gap="$4">
      <FlowSkeletonBlock h={22} w="62%" bg="$grey-200" />
      <FlowSkeletonBlock h={14} w="86%" />
      <FlowSkeletonBlock h={142} w="100%" br="$8" />
      <YStack gap="$2">
        <FlowSkeletonBlock h={16} w="90%" />
        <FlowSkeletonBlock h={16} w="74%" />
        <FlowSkeletonBlock h={16} w="80%" />
      </YStack>
    </YStack>
  )
}

export function WalletFlowErrorContent({ message, onClose }: { message: string; onClose: () => void }) {
  const { t } = useLingui()

  return (
    <YStack gap="$3">
      <Heading heading="h3">{t(commonMessages.somethingWentWrong)}</Heading>
      <Paragraph>{message}</Paragraph>
      <Button.Solid scaleOnPress onPress={onClose}>
        {t(commonMessages.close)}
      </Button.Solid>
    </YStack>
  )
}

function FlowRequestPartyHeader({
  title,
  subtitle,
  logo,
  logoFallback,
  hasHeaderAction,
}: Pick<WalletFlowShellProps, 'title' | 'subtitle' | 'logo' | 'logoFallback'> & {
  hasHeaderAction?: boolean
}) {
  const hasLogo = Boolean(logo?.url || logoFallback)

  if (!title && !subtitle && !hasLogo) return null

  return (
    <XStack ai="center" gap="$2.5" pr={hasHeaderAction ? '$8' : 0}>
      {hasLogo ? <FlowLogo logo={logo} fallback={logoFallback} /> : null}
      <YStack fg={1} gap="$1">
        {title ? <Heading heading="h3">{title}</Heading> : null}
        {subtitle ? <Paragraph variant="sub">{subtitle}</Paragraph> : null}
      </YStack>
    </XStack>
  )
}

export function WalletFlowShell({
  surface,
  title,
  subtitle,
  logo,
  logoFallback,
  isLoading,
  children,
  footer,
  onCancel,
}: WalletFlowShellProps) {
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()

  if (surface === 'overlay') {
    const topInset = Math.max(insets.top, 16)
    const maxDynamicContentSize = Math.max(360, height - topInset - Math.max(insets.bottom, 16))
    const headerAction = onCancel ? (
      <IconContainer aria-label="Cancel" icon={<HeroIcons.X />} onPress={onCancel} />
    ) : undefined

    return (
      <Stack flex-1 bg="transparent">
        <BottomSheet
          index={0}
          animateOnMount
          enableDynamicSizing
          maxDynamicContentSize={maxDynamicContentSize}
          topInset={topInset}
          enableOverDrag
          enableContentPanningGesture={false}
          overDragResistanceFactor={1.35}
          handleIndicatorStyle={{ backgroundColor: '#BCC3CF', width: 44 }}
          backgroundStyle={{ backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
        >
          {headerAction ? (
            <XStack pos="absolute" top="$5" right="$5" zi={4}>
              {headerAction}
            </XStack>
          ) : null}
          <BottomSheetScrollView
            alwaysBounceVertical
            style={{ maxHeight: maxDynamicContentSize }}
            contentContainerStyle={{
              padding: 20,
              paddingTop: 18,
              paddingBottom: insets.bottom + 24,
            }}
          >
            <YStack gap="$4">
              <FlowRequestPartyHeader
                title={title}
                subtitle={subtitle}
                logo={logo}
                logoFallback={logoFallback}
                hasHeaderAction={Boolean(headerAction)}
              />
              <YStack gap="$5">{isLoading ? <FlowSkeleton /> : children}</YStack>
            </YStack>
            {footer ? <YStack pt="$4">{footer}</YStack> : null}
          </BottomSheetScrollView>
        </BottomSheet>
      </Stack>
    )
  }

  return (
    <YStack flex-1 bg="$grey-50" pt={Math.max(insets.top, 18)} px="$5" pb={Math.max(insets.bottom, 18)} gap="$5">
      <FlowRequestPartyHeader title={title} subtitle={subtitle} logo={logo} logoFallback={logoFallback} />
      <Stack flex-1>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <YStack gap="$5">{isLoading ? <FlowSkeleton /> : children}</YStack>
        </ScrollView>
      </Stack>
      {footer ? <YStack>{footer}</YStack> : null}
    </YStack>
  )
}
