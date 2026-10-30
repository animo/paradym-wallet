import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Button, Spinner, YStack } from '@package/ui'
import { useEffect, useState } from 'react'
import { type NativeSyntheticEvent, PixelRatio, type TextLayoutEventData } from 'react-native'

interface DualResponseButtonProps {
  isLoading?: boolean
  /** Blocks only the accept action, leaving decline available. */
  isAcceptDisabled?: boolean
  onAccept: () => void
  onDecline: () => void
  acceptText?: string
  declineText?: string
  variant?: 'confirmation' | 'regular'
  align?: 'horizontal' | 'vertical'
  removeBottomPadding?: boolean
  /**
   * Never shortens a label: labels wrap instead of being ellipsized, and horizontally aligned buttons
   * move below each other at full width as soon as a label does not fit on one line beside the
   * other. For labels the wallet does not control and may not truncate, such as an issuer's.
   */
  wrapLabels?: boolean
}

export function DualResponseButtons({
  onAccept,
  onDecline,
  isLoading,
  isAcceptDisabled,
  align = 'vertical',
  acceptText,
  declineText,
  variant = 'regular',
  wrapLabels = false,
}: DualResponseButtonProps) {
  const { t } = useLingui()
  const accept = acceptText ?? t(commonMessages.acceptButton)
  const deline = declineText ?? t(commonMessages.declineButton)

  // Only ever switched on while laid out horizontally, so the two layouts cannot flip back and forth.
  // New labels get measured side by side again.
  const [isStacked, setIsStacked] = useState(false)
  useEffect(() => setIsStacked(false), [accept, deline])

  const isHorizontal = align === 'horizontal' && !isStacked

  // Give accept button more space to avoid truncation when OS font is scaled
  const giveAcceptButtonMoreSpace = PixelRatio.getFontScale() > 1.2 && accept.length > 6

  const wrapProps = wrapLabels
    ? ({
        ellipsis: false,
        height: 'auto',
        minHeight: 'size.buttonHeight',
        py: '2',
        // `f={1}` implies a zero basis, which in a column would hold a wrapped label to the minimum height.
        ...(isHorizontal ? {} : { flexBasis: 'auto' }),
        textProps: {
          textAlign: 'center',
          onTextLayout: (event: NativeSyntheticEvent<TextLayoutEventData>) => {
            if (isHorizontal && event.nativeEvent.lines.length > 1) setIsStacked(true)
          },
        },
      } as const)
    : {}

  return (
    <YStack gap={isHorizontal ? '4' : '2'} flexDirection={isHorizontal ? 'row-reverse' : 'column'}>
      <Button.Solid
        f={1}
        fg={giveAcceptButtonMoreSpace ? 2 : 1}
        disabled={isLoading || isAcceptDisabled}
        // A plain value would replace the button's press fade
        opacity={isAcceptDisabled ? 0.5 : '1 press:0.8'}
        onPress={onAccept}
        {...(variant === 'confirmation' ? { bg: 'danger-500' } : {})}
        {...wrapProps}
      >
        {isLoading ? <Spinner variant="dark" /> : accept}
      </Button.Solid>
      <Button.Outline f={1} bg="grey-100" disabled={isLoading} onPress={onDecline} {...wrapProps}>
        {deline}
      </Button.Outline>
    </YStack>
  )
}
