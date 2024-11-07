import { Button, HeroIcons, InfoButton, InfoSheet, Stack, useToastController } from '@package/ui'
import type { StatusVariant } from '@package/ui/src/utils/variants'
import { formatDate, formatDaysString, getDaysUntil } from '@package/utils/src'
import React, { useEffect, useMemo } from 'react'
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
  batchLeft?: number
}

export function CardInfoLifecycle({ validUntil, validFrom, isRevoked, batchLeft }: CardInfoLifecycleProps) {
  const toast = useToastController()
  const [isOpen, setIsOpen] = useState(false)
  const { withHaptics } = useHaptics()

  const state = useMemo(() => {
    if (isRevoked) return 'revoked'
    if (batchLeft) return 'batch'

    return 'active'
  }, [isRevoked, batchLeft])

  const onPress = withHaptics(() => setIsOpen(!isOpen))

  const onPressValidate = withHaptics(() => {
    // Implement navigation to the setup eID card flow.
    toast.show('Coming soon', { customData: { preset: 'warning' } })
  })

  if (validUntil || validFrom) {
    return <CardInfoLimitedByDate validUntil={validUntil} validFrom={validFrom} />
  }

  return (
    <>
      {batchLeft && batchLeft <= 5 && (
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
        description={
          batchLeft
            ? `${batchLeft} ${cardInfoLifecycleVariant[state].description}`
            : cardInfoLifecycleVariant[state].description
        }
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

function CardInfoLimitedByDate({ validUntil, validFrom }: { validUntil?: Date; validFrom?: Date }) {
  const [state, setState] = useState<CardInfoLimitedByDateState>('active')
  const [isOpen, setIsOpen] = useState(false)
  const { withHaptics } = useHaptics()

  const onPress = withHaptics(() => setIsOpen(!isOpen))

  useEffect(() => {
    if (validFrom && validFrom > new Date()) {
      setState('not-yet-active')
    } else if (validUntil && validUntil < new Date()) {
      setState('expired')
    } else if (validUntil && validUntil > new Date()) {
      setState('will-expire')
    } else {
      setState('active')
    }
  }, [validUntil, validFrom])

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
      variant: 'warning',
      title: 'Card will expire',
      description: `Expires in ${expiryDaysString}`,
      sheetDescription: (validityPeriod ?? expiryString) as string,
    },
  }
}
