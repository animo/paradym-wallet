import { dcApiRegisterOptions } from '@easypid/utils/dcApiRegisterOptions'
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
}

export function DeleteCredentialSheet({ isSheetOpen, setIsSheetOpen, id, name }: DeleteCredentialSheetProps) {
  const { paradym } = useParadym('unlocked')
  const toast = useToastController()
  const navigation = useNavigation()
  const { withHaptics, successHaptic, errorHaptic } = useHaptics()
  const { t } = useLingui()

  const onDeleteCredential = async () => {
    try {
      setIsSheetOpen(false)
      await paradym.deleteCredentials(dcApiRegisterOptions({ paradym, credentialIds: [id] }))

      toast.show(t(commonMessages.toastCardArchived), {
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
    navigation.goBack()
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
