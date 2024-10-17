import { InfoButton, InfoSheet } from '@package/ui'
import React from 'react'
import { useState } from 'react'
import { useHaptics } from '../hooks/useHaptics'

export function CardInfoLifecycle() {
  const [isOpen, setIsOpen] = useState(false)
  const { light } = useHaptics()

  const onPress = () => {
    setIsOpen(true)
    light()
  }

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
        variant="positive"
        title="Card is active"
        description="Your credentials may expire or require an active internet connection to validate."
      />
    </>
  )
}
