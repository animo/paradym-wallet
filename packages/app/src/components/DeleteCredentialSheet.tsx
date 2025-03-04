import {
  type CredentialCategoryMetadata,
  type CredentialForDisplayId,
  deleteCredential,
  useAgent,
  useCredentialByCategory,
  useCredentialForDisplayById,
} from '@package/agent/src'
import { useToastController } from '@package/ui'
import { useNavigation } from 'expo-router'
import { useHaptics } from '../hooks'
import { ConfirmationSheet } from './ConfirmationSheet'

interface DeleteCredentialSheetProps {
  isSheetOpen: boolean
  setIsSheetOpen: (isOpen: boolean) => void
  id: CredentialForDisplayId
  category?: CredentialCategoryMetadata['credentialCategory']
  name: string
}

export function DeleteCredentialSheet({ isSheetOpen, setIsSheetOpen, id, name }: DeleteCredentialSheetProps) {
  const toast = useToastController()
  const { agent } = useAgent()
  const navigation = useNavigation()
  const { withHaptics, successHaptic, errorHaptic } = useHaptics()

  const { credential } = useCredentialForDisplayById(id)
  const { credentials } = useCredentialByCategory(credential?.category?.credentialCategory)

  const onDeleteCredential = async () => {
    try {
      // Only navigate back and update UI after successful deletion
      navigation.goBack()
      setIsSheetOpen(false)

      if (credentials?.length) {
        await Promise.all(credentials.map((credential) => deleteCredential(agent, credential.id)))
        console.log('deleted length', credentials.length)
      } else {
        await deleteCredential(agent, id)
      }

      toast.show('Card successfully archived', {
        customData: { preset: 'success' },
      })
      successHaptic()
    } catch (error) {
      toast.show('Error deleting card', {
        customData: { preset: 'danger' },
      })
      errorHaptic()
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
