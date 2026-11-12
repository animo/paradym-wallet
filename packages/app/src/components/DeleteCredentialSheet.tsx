import { dcApiRegisterOptions } from '@app/utils/dcApiRegisterOptions'
import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { useToastController } from '@package/ui'
import type { CredentialId } from '@paradym/wallet-sdk'
import { useParadym } from '@paradym/wallet-sdk'
import { useNavigation } from 'expo-router'
import { useHaptics } from '../hooks'
import { ConfirmationSheet } from './ConfirmationSheet'

interface DeleteCredentialSheetProps {
  isSheetOpen: boolean
  setIsSheetOpen: (isOpen: boolean) => void
  id: CredentialId
  name: string
  // Called before the card is deleted, so the screen showing it can close first. Goes back by default.
  onDone?: () => void
}

export function DeleteCredentialSheet({ isSheetOpen, setIsSheetOpen, id, name, onDone }: DeleteCredentialSheetProps) {
  const { paradym } = useParadym('unlocked')
  const toast = useToastController()
  const navigation = useNavigation()
  const { withHaptics, successHaptic, errorHaptic } = useHaptics()
  const { t } = useLingui()

  const onDeleteCredential = async () => {
    setIsSheetOpen(false)
    if (onDone) onDone()
    else navigation.goBack()

    try {
      await paradym.deleteCredentials(dcApiRegisterOptions({ paradym, credentialIds: [id] }))

      toast.show(t(commonMessages.toastCardDeleted), {
        customData: { preset: 'success' },
      })

      successHaptic()
    } catch (error) {
      paradym.logger.error('Error occurred while trying to delete a credential', { cause: error })
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
      title={t(commonMessages.deleteCardTitle)}
      description={t(commonMessages.deleteCardDescription(name))}
      confirmText={t(commonMessages.deleteCardConfirm)}
      onConfirm={onDeleteCredential}
      onCancel={onCancel}
    />
  )
}
