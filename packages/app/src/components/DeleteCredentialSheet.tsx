import { usePidCredential } from '@easypid/hooks'
import { type CredentialForDisplayId, deleteCredential, useAgent } from '@package/agent/src'
import { Heading, HeroIcons, Paragraph, Stack, XStack, useToastController } from '@package/ui'
import { FloatingSheet } from '@package/ui/src/panels/FloatingSheet'
import { useState } from 'react'
import { useHaptics } from '../hooks'
import { ConfirmationSheet } from './ConfirmationSheet'
import { DualResponseButtons } from './DualResponseButtons'

interface DeleteCredentialSheetProps {
  isSheetOpen: boolean
  setIsSheetOpen: (isOpen: boolean) => void
  id: CredentialForDisplayId
  name: string
}

export function DeleteCredentialSheet({ isSheetOpen, setIsSheetOpen, id, name }: DeleteCredentialSheetProps) {
  const { credential } = usePidCredential()
  const toast = useToastController()
  const { agent } = useAgent()
  const [isLoading, setIsLoading] = useState(false)
  const { withHaptics, error, success } = useHaptics()

  const onDeleteCredential = async () => {
    if (credential && id === credential?.id) {
      toast.show('Personalausweis can not be archived', {
        customData: {
          preset: 'warning',
        },
      })
      setIsSheetOpen(false)
      error()
      return
    }

    try {
      await deleteCredential(agent, id)
      toast.show('Card successfully archived', {
        customData: {
          preset: 'success',
        },
      })
      success()
      setIsSheetOpen(false)
    } catch (error) {
      toast.show('Error deleting card', {
        customData: {
          preset: 'danger',
        },
      })
      console.error(error)
    }

    setIsLoading(false)
  }

  const onCancel = withHaptics(() => setIsSheetOpen(false))

  return (
    <ConfirmationSheet
      type="floating"
      isOpen={isSheetOpen}
      setIsOpen={setIsSheetOpen}
      title="Archive card?"
      description={`This will make '${name}' unusable and delete it from your wallet.`}
      onConfirm={onDeleteCredential}
      onCancel={onCancel}
    />
  )
}
