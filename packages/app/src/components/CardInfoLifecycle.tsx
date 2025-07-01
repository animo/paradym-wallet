import { Button, HeroIcons, InfoButton, InfoSheet, Stack } from '@package/ui'
import type { StatusVariant } from '@package/ui/utils/variants'
import { formatDate, formatDaysString, getDaysUntil } from '@package/utils'
import { useRouter } from 'expo-router'
import { useEffect, useMemo } from 'react'
import { useState } from 'react'
import { useHaptics } from '../hooks/useHaptics'

// Expired requires a different flow (see component below)
type BaseLifeCycle = 'active' | 'revoked' | 'batch'

type LifeCycleContent = {
  variant: StatusVariant
  title: string
  description: string
  sheetDescription: string
}

const cardInfoLifecycleVariant: Record<BaseLifeCycle, LifeCycleContent> = {
  active: {
    variant: 'positive',
    title: 'Card is active',
    description: 'No actions required',
    sheetDescription: 'Your credentials may expire or require an active internet connection to validate.',
  },
  revoked: {
    variant: 'danger',
    title: 'Card revoked',
    description: 'Card not usable anymore',
    sheetDescription:
      'The issuer has revoked this card and it can not be used anymore. Contact the issuer for more information.',
  },
  // We can hardcode this to the rules for the PID credential as this will be the only of this type for now.
  batch: {
    variant: 'warning',
    title: 'Limited card usage',
    description: 'verifications left',
    sheetDescription:
      'This card requires periodic validation using an internet connection. When usage is low you will be notified.',
  },
}

interface CardInfoLifecycleProps {
  validUntil?: Date
  validFrom?: Date
  isRevoked?: boolean
  hasRefreshToken?: boolean
}

export function CardInfoLifecycle({ validUntil, validFrom, isRevoked, hasRefreshToken }: CardInfoLifecycleProps) {
  const { push } = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { withHaptics } = useHaptics()

  const state = useMemo(() => {
    if (isRevoked) return 'revoked'

    return 'active'
  }, [isRevoked])

  const onPress = withHaptics(() => setIsOpen(!isOpen))

  // TODO: Check if refresh token is expired
  // Should also make sure that pid setup works when refresh token is expired
  const isRefreshTokenExpired = false
  const onPressValidate = withHaptics(() => {
    withHaptics(() => push('/pidSetup'))
  })

  if (validUntil || validFrom) {
    return <CardInfoLimitedByDate validUntil={validUntil} validFrom={validFrom} hasRefreshToken={hasRefreshToken} />
  }

  return (
    <>
      {isRefreshTokenExpired && (
        <Stack pb="$4">
          <Button.Solid bg="$grey-50" bw="$0.5" borderColor="$grey-200" color="$grey-900" onPress={onPressValidate}>
            Refresh card <HeroIcons.ArrowPath ml="$-2" size={20} color="$grey-700" />
          </Button.Solid>
        </Stack>
      )}
      <InfoButton
        routingType="modal"
        variant={cardInfoLifecycleVariant[state].variant}
        title={cardInfoLifecycleVariant[state].title}
        description={cardInfoLifecycleVariant[state].description}
        onPress={onPress}
      />
      <InfoSheet
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onClose={onPress}
        variant={cardInfoLifecycleVariant[state].variant}
        title={cardInfoLifecycleVariant[state].title}
        description={cardInfoLifecycleVariant[state].sheetDescription}
      />
    </>
  )
}

type CardInfoLimitedByDateState = 'not-yet-active' | 'active' | 'will-expire' | 'expired'

function CardInfoLimitedByDate({
  validUntil,
  validFrom,
  hasRefreshToken,
}: { validUntil?: Date; validFrom?: Date; hasRefreshToken?: boolean }) {
  const [state, setState] = useState<CardInfoLimitedByDateState>('active')
  const [isOpen, setIsOpen] = useState(false)
  const { withHaptics } = useHaptics()

  const onPress = withHaptics(() => setIsOpen(!isOpen))

  useEffect(() => {
    // If both are passed, then the credential is expired
    if (validUntil && validUntil < new Date()) {
      setState('expired')

      // If validFrom is in the future, then the credential is not yet active
    } else if (validFrom && validFrom > new Date()) {
      setState('not-yet-active')

      // If it has a refresh token, then the credential is set to active (unless already expired)
    } else if (hasRefreshToken) {
      setState('active')

      // If validUntil is in the future, then the credential will expire
    } else if (validUntil && validUntil > new Date()) {
      // Expiry notice will be shown if validUntil less than 2 weeks away
      // As defined in getCardInfoLimitedByDateVariant below
      setState('will-expire')
    } else {
      setState('active')
    }
  }, [validUntil, validFrom, hasRefreshToken])

  const content = getCardInfoLimitedByDateVariant(validUntil, validFrom)[state]

  return (
    <>
      <InfoButton
        routingType="modal"
        variant={content.variant}
        title={content.title}
        description={content.description}
        onPress={onPress}
      />
      <InfoSheet
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onClose={onPress}
        variant={content.variant}
        title={content.title}
        description={content.sheetDescription}
      />
    </>
  )
}

function getCardInfoLimitedByDateVariant(
  validUntil?: Date,
  validFrom?: Date
): Record<CardInfoLimitedByDateState, LifeCycleContent> {
  const daysUntilExpiration = getDaysUntil(validUntil)
  const daysUntilActivation = getDaysUntil(validFrom)

  const activeDaysString = formatDaysString(daysUntilActivation)
  const expiryDaysString = formatDaysString(daysUntilExpiration)

  const validityPeriod =
    validFrom && validUntil
      ? `The validity period of this card is from ${formatDate(validFrom)} until ${formatDate(validUntil)}.`
      : undefined

  const activeString = validFrom && `This card will be active in ${activeDaysString}, on ${formatDate(validFrom)}.`
  const expiryString = validUntil && `This card expires in ${expiryDaysString}, on ${formatDate(validUntil)}.`

  // Check if card expires in more than 2 weeks (14 days)
  const hasMoreThanTwoWeeksUntilExpiry =
    validUntil && validUntil.getTime() - new Date().getTime() > 14 * 24 * 60 * 60 * 1000

  return {
    active: {
      variant: 'positive',
      title: 'Card is active',
      description: 'No actions required',
      sheetDescription: 'Some credentials may expire or require an active internet connection to validate',
    },
    expired: {
      variant: 'default',
      title: 'Card expired',
      description: 'The expiration date of this card has passed',
      sheetDescription: `The expiration date of this card has passed on ${validUntil?.toLocaleDateString()}.`,
    },
    'not-yet-active': {
      variant: 'default',
      title: 'Card not active',
      description: `Will be active in ${activeDaysString}`,
      sheetDescription: (validityPeriod ?? activeString) as string,
    },
    'will-expire': {
      variant: hasMoreThanTwoWeeksUntilExpiry ? 'positive' : 'warning',
      title: hasMoreThanTwoWeeksUntilExpiry ? 'Card is active' : 'Card will expire',
      description: hasMoreThanTwoWeeksUntilExpiry ? 'No actions required' : `Expires in ${expiryDaysString}`,
      sheetDescription: (validityPeriod ?? expiryString) as string,
    },
  }
}
