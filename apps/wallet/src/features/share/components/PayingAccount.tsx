import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Paragraph, XStack, YStack } from '@package/ui'
import type { ReactNode } from 'react'

/**
 * The card a payment is paid with, shown as the card under a heading, never as a credential with its attributes.
 * `children` is the card's row, usually a `CardRow`.
 */
export function PayingAccount({
  label,
  action,
  onPress,
  children,
}: {
  /** The issuer's own heading, when the card supplies one. */
  label?: string
  action?: ReactNode
  onPress?: () => void
  children: ReactNode
}) {
  const { t } = useLingui()

  return (
    <YStack gap="2">
      <XStack items="center" justify="space-between" gap="2">
        <Paragraph variant="sub" fontWeight="semiBold" color="grey-600" flexShrink={1}>
          {label ?? t(commonMessages.payingAccount)}
        </Paragraph>
        {action}
      </XStack>
      <XStack
        p="3"
        rounded="6"
        borderWidth={1}
        borderColor="grey-200"
        bg="background"
        onPress={onPress}
        opacity={onPress ? '1 press:0.8' : undefined}
      >
        {children}
      </XStack>
    </YStack>
  )
}
