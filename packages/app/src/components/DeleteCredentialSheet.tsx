import { type CredentialForDisplayId, deleteCredential, useAgent } from '@package/agent/src'
import { useToastController } from '@package/ui'
import { useNavigation } from 'expo-router'
import { router } from 'expo-router'
import { useHaptics } from '../hooks'
import { ConfirmationSheet } from './ConfirmationSheet'

interface DeleteCredentialSheetProps {
  isSheetOpen: boolean
  setIsSheetOpen: (isOpen: boolean) => void
  id: CredentialForDisplayId
  name: string
}

export function DeleteCredentialSheet({ isSheetOpen, setIsSheetOpen, id, name }: DeleteCredentialSheetProps) {
  const toast = useToastController()
  const { agent } = useAgent()
  const navigation = useNavigation()
  const { withHaptics, successHaptic, errorHaptic } = useHaptics()

  const onDeleteCredential = async () => {
    try {
      navigation.goBack()
      await deleteCredential(agent, id)
      toast.show('Card successfully archived', {
        customData: {
          preset: 'success',
        },
      })
      successHaptic()
      setIsSheetOpen(false)
    } catch (error) {
      toast.show('Error deleting card', {
        customData: {
          preset: 'danger',
        },
      })
      errorHaptic()
      console.error(error)
    }
  }

  const onCancel = withHaptics(() => setIsSheetOpen(false))

  return (
    <ConfirmationSheet
      type="floating"
      isOpen={isSheetOpen}
      setIsOpen={setIsSheetOpen}
      title="Archive card?"
      description={`This will make '${name}' unusable and delete it from your wallet.`}
      confirmText="Yes, archive"
      onConfirm={onDeleteCredential}
      onCancel={onCancel}
    />
  )
}
