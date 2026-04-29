import { dcApiRegisterOptions } from '@easypid/utils/dcApiRegisterOptions'
import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { useToastController } from '@package/ui'
import type { CredentialId } from '@paradym/wallet-sdk'
import { useCredentialByCategory, useCredentialById, useParadym } from '@paradym/wallet-sdk'
import { useNavigation } from 'expo-router'
import { useHaptics } from '../hooks'
import { ConfirmationSheet } from './ConfirmationSheet'

interface DeleteCredentialSheetProps {
  isSheetOpen: boolean
  setIsSheetOpen: (isOpen: boolean) => void
  id: CredentialId
  name: string
  onDeletingChange?: (isDeleting: boolean) => void
}

export function DeleteCredentialSheet({
  isSheetOpen,
  setIsSheetOpen,
  id,
  name,
  onDeletingChange,
}: DeleteCredentialSheetProps) {
  const { paradym } = useParadym('unlocked')

  const toast = useToastController()
  const navigation = useNavigation()
  const { withHaptics, successHaptic, errorHaptic } = useHaptics()
  const { t } = useLingui()
  const { credential } = useCredentialById(id)
  const { credentials } = useCredentialByCategory(credential?.category?.credentialCategory ?? 'NO_CATEGORY')

  const onDeleteCredential = async () => {
    try {
      onDeletingChange?.(true)
      const credentialIds = credentials?.length ? credentials.map((c) => c.id) : id
      const deleteResult = await paradym.deleteCredentials(dcApiRegisterOptions({ paradym, credentialIds }))
      if (!deleteResult.success) throw new Error(deleteResult.message)

      navigation.goBack()
      setIsSheetOpen(false)

      toast.show(t(commonMessages.toastCardArchived), {
        customData: { preset: 'success' },
      })
      successHaptic()
    } catch (_error) {
      onDeletingChange?.(false)
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
