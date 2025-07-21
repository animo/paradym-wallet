import type { MessageDescriptor } from '@lingui/core'
import { defineMessage } from '@lingui/core/macro'
import { Trans, useLingui } from '@lingui/react/macro'
import { Button, HeroIcons, InfoButton, InfoSheet, Stack } from '@package/ui'
import type { StatusVariant } from '@package/ui/utils/variants'
import { formatDate, formatDaysString, getDaysUntil } from '@package/utils'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { useState } from 'react'
import { useHaptics } from '../hooks/useHaptics'

// Expired requires a different flow (see component below)
type BaseLifeCycle = 'active' | 'revoked' | 'batch'

type LifeCycleContent = {
  variant: StatusVariant
  title: MessageDescriptor
  description: MessageDescriptor
  sheetDescription: MessageDescriptor
}

const cardInfoLifecycleVariant: Record<BaseLifeCycle, LifeCycleContent> = {
  active: {
    variant: 'positive',
    title: defineMessage({ id: 'cardLifecycle.active.title', message: 'Card is active' }),
    description: defineMessage({ id: 'cardLifecycle.active.description', message: 'No actions required' }),
    sheetDescription: defineMessage({
      id: 'cardLifecycle.active.sheetDescription',
      message: 'Your credentials may expire or require an active internet connection to validate.',
    }),
  },
  revoked: {
    variant: 'danger',
    title: defineMessage({ id: 'cardLifecycle.revoked.title', message: 'Card revoked' }),
    description: defineMessage({ id: 'cardLifecycle.revoked.description', message: 'Card not usable anymore' }),
    sheetDescription: defineMessage({
      id: 'cardLifecycle.revoked.sheetDescription',
      message:
        'The issuer has revoked this card and it can not be used anymore. Contact the issuer for more information.',
    }),
  },
  // We can hardcode this to the rules for the PID credential as this will be the only of this type for now.
  batch: {
    variant: 'warning',
    title: defineMessage({ id: 'cardLifecycle.batch.title', message: 'Limited card usage' }),
    description: defineMessage({ id: 'cardLifecycle.batch.description', message: 'verifications left' }),
    sheetDescription: defineMessage({
      id: 'cardLifecycle.batch.sheetDescription',
      message:
        'This card requires periodic validation using an internet connection. When usage is low you will be notified.',
    }),
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
  const state = isRevoked ? 'revoked' : 'active'

  const { t } = useLingui()

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
            <Trans id="cardLifecycle.refreshCardButton">Refresh card</Trans>{' '}
            <HeroIcons.ArrowPath ml="$-2" size={20} color="$grey-700" />
          </Button.Solid>
        </Stack>
      )}
      <InfoButton
        routingType="modal"
        variant={cardInfoLifecycleVariant[state].variant}
        title={t(cardInfoLifecycleVariant[state].title)}
        description={t(cardInfoLifecycleVariant[state].description)}
        onPress={withHaptics(() => setIsOpen(true))}
      />
      <InfoSheet
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onClose={withHaptics(() => setIsOpen(false))}
        variant={cardInfoLifecycleVariant[state].variant}
        title={t(cardInfoLifecycleVariant[state].title)}
        description={t(cardInfoLifecycleVariant[state].sheetDescription)}
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
  const { t } = useLingui()

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
        title={t(content.title)}
        description={t(content.description)}
        onPress={withHaptics(() => setIsOpen(true))}
      />
      <InfoSheet
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onClose={withHaptics(() => setIsOpen(false))}
        variant={content.variant}
        title={t(content.title)}
        description={t(content.sheetDescription)}
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
      ? defineMessage({
          id: 'cardLifecycle.limitedByDate.validityPeriod',
          message: `The validity period of this card is from ${formatDate(validFrom)} until ${formatDate(validUntil)}.`,
        })
      : undefined

  const activeString =
    validFrom &&
    defineMessage({
      id: 'cardLifecycle.limitedByDate.activeIn',
      message: `This card will be active in ${activeDaysString}, on ${formatDate(validFrom)}.`,
    })
  const expiryString =
    validUntil &&
    defineMessage({
      id: 'cardLifecycle.limitedByDate.expiresIn',
      message: `This card expires in ${expiryDaysString}, on ${formatDate(validUntil)}.`,
    })

  // Check if card expires in more than 2 weeks (14 days)
  const hasMoreThanTwoWeeksUntilExpiry =
    validUntil && validUntil.getTime() - new Date().getTime() > 14 * 24 * 60 * 60 * 1000

  return {
    active: {
      variant: 'positive',
      title: cardInfoLifecycleVariant.active.title,
      description: defineMessage({
        id: 'cardLifecycle.limitedByDate.active.description',
        message: 'No actions required',
      }),
      sheetDescription: defineMessage({
        id: 'cardLifecycle.limitedByDate.active.sheetDescription',
        message: 'Some credentials may expire or require an active internet connection to validate',
      }),
    },
    expired: {
      variant: 'default',
      title: defineMessage({ id: 'cardLifecycle.limitedByDate.expired.title', message: 'Card expired' }),
      description: defineMessage({
        id: 'cardLifecycle.limitedByDate.expired.description',
        message: 'The expiration date of this card has passed',
      }),
      sheetDescription: defineMessage({
        id: 'cardLifecycle.limitedByDate.expired.sheetDescription',
        message: `The expiration date of this card has passed on ${validUntil?.toLocaleDateString()}.`,
      }),
    },
    'not-yet-active': {
      variant: 'default',
      title: defineMessage({ id: 'cardLifecycle.limitedByDate.notYetActive.title', message: 'Card not active' }),
      description: defineMessage({
        id: 'cardLifecycle.limitedByDate.notYetActive.description',
        message: `Will be active in ${activeDaysString}`,
      }),
      sheetDescription: (validityPeriod ?? activeString) as MessageDescriptor,
    },
    'will-expire': {
      variant: hasMoreThanTwoWeeksUntilExpiry ? 'positive' : 'warning',
      title: hasMoreThanTwoWeeksUntilExpiry
        ? cardInfoLifecycleVariant.active.title
        : defineMessage({ id: 'cardLifecycle.limitedByDate.willExpire.title', message: 'Card will expire' }),
      description: hasMoreThanTwoWeeksUntilExpiry
        ? cardInfoLifecycleVariant.active.description
        : defineMessage({
            id: 'cardLifecycle.limitedByDate.willExpire.description',
            message: `Expires in ${expiryDaysString}`,
          }),
      sheetDescription: (validityPeriod ?? expiryString) as MessageDescriptor,
    },
  }
}
