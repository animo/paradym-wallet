import { useLingui } from '@lingui/react/macro'
import { BackFooter, DeleteCredentialSheet, useHaptics } from '@package/app'
import { commonMessages } from '@package/translations'
import { FlexPage, TwoPane, useMedia, useToastController } from '@package/ui'
import { type CredentialId, useCredentialById } from '@paradym/wallet-sdk'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { CredentialDetail } from './components/CredentialDetail'
import { CredentialDetailAttributes } from './components/CredentialDetailAttributes'

export function CredentialDetailScreen() {
  const { id } = useLocalSearchParams<{ id: CredentialId }>()
  const toast = useToastController()
  const router = useRouter()
  const { t } = useLingui()
  const media = useMedia()
  const { withHaptics } = useHaptics()
  const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false)

  const { credential } = useCredentialById(id)

  if (!credential) {
    toast.show(t(commonMessages.credentialNotFound), {
      customData: {
        preset: 'danger',
      },
    })
    router.back()
    return
  }

  return (
    <FlexPage gap="0" paddingHorizontal="0" {...(media.wide && { maxWidth: '100%' })}>
      {media.wide ? (
        // Wide windows show the attributes next to the card, and both actions in the header
        <>
          <TwoPane
            start={<CredentialDetail credential={credential} showAttributesLink={false} showDeleteAction={false} />}
            end={
              <CredentialDetailAttributes
                credential={credential}
                onDelete={
                  (credential.category?.canDeleteCredential ?? true)
                    ? withHaptics(() => setIsDeleteSheetOpen(true))
                    : undefined
                }
              />
            }
          />
          <DeleteCredentialSheet
            isSheetOpen={isDeleteSheetOpen}
            setIsSheetOpen={setIsDeleteSheetOpen}
            id={credential.id}
            name={credential.display.name ?? t(commonMessages.unknown)}
          />
        </>
      ) : (
        <CredentialDetail credential={credential} />
      )}
      <BackFooter />
    </FlexPage>
  )
}
