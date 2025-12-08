import { useLingui } from '@lingui/react/macro'
import { type CredentialIssuerDisplay, deleteDeferredCredential, storeReceivedActivity, useAgent } from '@package/agent'
import { commonMessages } from '@package/translations'
import { useToastController } from '@package/ui'
import { useNavigation } from 'expo-router'
import { useHaptics } from '../hooks'
import { ConfirmationSheet } from './ConfirmationSheet'

interface DeleteCredentialSheetProps {
  isSheetOpen: boolean
  setIsSheetOpen: (isOpen: boolean) => void
  id: string
  name: string
  hasErrors: boolean
  issuerDisplay: CredentialIssuerDisplay
  issuerId?: string
}

export function DeleteDeferredCredentialSheet({
  isSheetOpen,
  setIsSheetOpen,
  id,
  name,
  hasErrors,
  issuerId,
  issuerDisplay,
}: DeleteCredentialSheetProps) {
  const toast = useToastController()
  const { agent } = useAgent()
  const navigation = useNavigation()
  const { withHaptics, successHaptic, errorHaptic } = useHaptics()
  const { t } = useLingui()

  const onDeleteDeferredCredential = async () => {
    try {
      // Only navigate back and update UI after successful deletion
      navigation.goBack()
      setIsSheetOpen(false)

      await deleteDeferredCredential(agent, id)

      await storeReceivedActivity(agent, {
        entityId: issuerId,
        host: issuerDisplay.domain,
        name: issuerDisplay.name,
        logo: issuerDisplay.logo,
        backgroundColor: '#ffffff', // Default to a white background for now
        status: hasErrors ? 'failed' : 'stopped',
        deferredCredentials: [],
        credentialIds: [],
      })

      toast.show(t(commonMessages.toastDeferredCredentialDeleted), {
        customData: { preset: 'success' },
      })
      successHaptic()
    } catch (_error) {
      toast.show(t(commonMessages.toastDeferredCredentialDeleteError), {
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
      title={t(commonMessages.deleteDeferredCredentialTitle)}
      description={t(commonMessages.deleteDeferredCredentialDescription(name))}
      confirmText={t(commonMessages.deleteDeferredCredentialConfirm)}
      onConfirm={onDeleteDeferredCredential}
      onCancel={onCancel}
    />
  )
}
