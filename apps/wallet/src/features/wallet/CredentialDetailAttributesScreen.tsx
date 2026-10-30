import { useLingui } from '@lingui/react/macro'
import { BackFooter } from '@package/app/components'
import { FlexPage, useToastController } from '@package/ui'
import { type CredentialId, useCredentialById } from '@paradym/wallet-sdk'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CredentialDetailAttributes } from './components/CredentialDetailAttributes'

export function CredentialDetailAttributesScreen() {
  const { id } = useLocalSearchParams<{ id: CredentialId }>()
  const { credential } = useCredentialById(id)

  const toast = useToastController()
  const router = useRouter()
  const { t } = useLingui()

  if (!credential) {
    toast.show(
      t({
        id: 'credentials.noAttributes',
        message: 'No attributes found',
        comment: 'Error toast when a credential has no displayable attributes',
      }),
      {
        customData: {
          preset: 'danger',
        },
      }
    )
    router.back()
    return
  }

  return (
    <FlexPage gap="0" paddingHorizontal="0">
      <CredentialDetailAttributes credential={credential} />
      <BackFooter />
    </FlexPage>
  )
}
