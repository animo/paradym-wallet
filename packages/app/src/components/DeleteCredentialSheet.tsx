import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { useToastController } from '@package/ui'
import { useCredentialByCategory, useCredentialById, useParadym } from '@paradym/wallet-sdk/hooks'
import type { CredentialId } from '@paradym/wallet-sdk/hooks'
import type { CredentialCategoryMetadata } from '@paradym/wallet-sdk/metadata/credentials'
import { useNavigation } from 'expo-router'
import { useHaptics } from '../hooks'
import { ConfirmationSheet } from './ConfirmationSheet'

interface DeleteCredentialSheetProps {
  isSheetOpen: boolean
  setIsSheetOpen: (isOpen: boolean) => void
  id: CredentialId
  category?: CredentialCategoryMetadata['credentialCategory']
  name: string
}

export function DeleteCredentialSheet({ isSheetOpen, setIsSheetOpen, id, name }: DeleteCredentialSheetProps) {
  const { paradym } = useParadym('unlocked')

  const toast = useToastController()
  const navigation = useNavigation()
  const { withHaptics, successHaptic, errorHaptic } = useHaptics()
  const { t } = useLingui()
  const { credential } = useCredentialById(id)
  const { credentials } = useCredentialByCategory(credential?.category?.credentialCategory)

  const onDeleteCredential = async () => {
    try {
      // Only navigate back and update UI after successful deletion
      navigation.goBack()
      setIsSheetOpen(false)

      await paradym.credentials.delete(credentials?.map((c) => c.id) ?? id)

      toast.show(t(commonMessages.toastCardArchived), {
        customData: { preset: 'success' },
      })
      successHaptic()
    } catch (error) {
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
