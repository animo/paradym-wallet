import { useLingui } from '@lingui/react/macro'
import {
  type CredentialCategoryMetadata,
  type CredentialForDisplayId,
  deleteCredential,
  useAgent,
  useCredentialByCategory,
  useCredentialForDisplayById,
} from '@package/agent'
import { commonMessages } from '@package/translations'
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
  const { t } = useLingui()
  const { credential } = useCredentialForDisplayById(id)
  const { credentials } = useCredentialByCategory(credential?.category?.credentialCategory)

  const onDeleteCredential = async () => {
    try {
      // Only navigate back and update UI after successful deletion
      navigation.goBack()
      setIsSheetOpen(false)

      if (credentials?.length) {
        await Promise.all(credentials.map((credential) => deleteCredential(agent, credential.id)))
      } else {
        await deleteCredential(agent, id)
      }

      toast.show(t(commonMessages.toastCardArchived), {
        customData: { preset: 'success' },
      })
      successHaptic()
    } catch (_error) {
      toast.show(t(commonMessages.toastCardDeleteError), {
        customData: { preset: 'danger' },
      })
      errorHaptic()
    }
  }

  const onCancel = withHaptics(() => setIsSheetOpen(false))

  return (
    <ConfirmationSheet
      isOpen={isSheetOpen}
      setIsOpen={setIsSheetOpen}
      title={t(commonMessages.archiveCardTitle)}
      description={t(commonMessages.archiveCardDescription(name))}
      confirmText={t(commonMessages.archiveCardConfirm)}
      onConfirm={onDeleteCredential}
      onCancel={onCancel}
    />
  )
}
