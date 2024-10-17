import { usePidCredential } from '@easypid/hooks'
import { type CredentialForDisplayId, deleteCredential, useAgent } from '@package/agent/src'
import { Heading, HeroIcons, Paragraph, Stack, XStack, useToastController } from '@package/ui'
import { FloatingSheet } from '@package/ui/src/panels/FloatingSheet'
import { useState } from 'react'
import { DualResponseButtons } from './DualResponseButtons'

export function DeleteCredentialSheet({
  isSheetOpen,
  setIsSheetOpen,
  id,
  name,
}: {
  name: string
  isSheetOpen: boolean
  setIsSheetOpen: (isOpen: boolean) => void
  id: CredentialForDisplayId
}) {
  const { credential } = usePidCredential()
  const toast = useToastController()
  const { agent } = useAgent()
  const [isLoading, setIsLoading] = useState(false)

  const onDeleteCredential = async () => {
    if (credential && id === credential?.id) {
      toast.show('Personalausweis can not be deleted', {
        customData: {
          preset: 'warning',
        },
      })
      setIsSheetOpen(false)
      return
    }

    setIsLoading(true)

    try {
      await deleteCredential(agent, id)
      toast.show('Credential deleted', {
        customData: {
          preset: 'success',
        },
      })
    } catch (error) {
      toast.show('Error deleting credential', {
        customData: {
          preset: 'danger',
        },
      })
      console.error(error)
    }

    setIsLoading(false)
  }

  return (
    <FloatingSheet isOpen={isSheetOpen} setIsOpen={setIsSheetOpen}>
      <Stack p="$4" gap="$4">
        <XStack jc="space-between">
          <Heading color="$grey-900" variant="h2">
            Archive card?
          </Heading>
          <Stack br="$12" p="$2" bg="$grey-50" onPress={() => setIsSheetOpen(false)}>
            <HeroIcons.X size={16} strokeWidth={2.5} color="$grey-500" />
          </Stack>
        </XStack>
        <Stack borderBottomWidth="$0.5" borderColor="$grey-100" />
        <Paragraph>This will make '{name}' unusable and delete it from your wallet.</Paragraph>
        <DualResponseButtons
          align="horizontal"
          isLoading={isLoading}
          variant="confirmation"
          acceptText="Delete"
          declineText="Cancel"
          onAccept={onDeleteCredential}
          onDecline={() => setIsSheetOpen(false)}
          removeBottomPadding
        />
      </Stack>
    </FloatingSheet>
  )
}
