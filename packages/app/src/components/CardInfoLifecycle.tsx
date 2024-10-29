import { InfoButton, InfoSheet } from '@package/ui'
import React from 'react'
import { useState } from 'react'
import { useHaptics } from '../hooks/useHaptics'

export function CardInfoLifecycle() {
  const [isOpen, setIsOpen] = useState(false)
  const { withHaptics } = useHaptics()

  const onPress = withHaptics(() => setIsOpen(!isOpen))

  return (
    <>
      <InfoButton
        routingType="modal"
        variant="positive"
        title="Card is active"
        description="No actions required"
        onPress={onPress}
      />
      <InfoSheet
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onClose={onPress}
        variant="positive"
        title="Card is active"
        description="Your credentials may expire or require an active internet connection to validate."
      />
    </>
  )
}
