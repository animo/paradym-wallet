import type { LoadedCredential } from '@easypid/features/share/slides/Ts12BaseSlide'
import { Trans, useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { FloatingSheet, Heading, HeroIcons, Stack, YStack } from '@package/ui'
import { useState } from 'react'
import { Pressable } from 'react-native'
import { Circle, Path, Svg } from 'react-native-svg'
import { CredentialCard } from './CredentialCard'

interface CredentialSelectionCardProps {
  credentials: LoadedCredential[]
  selectedCredentialId: string | null
  onSelect: (id: string) => void
}

function ActiveCheckbox() {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="11.75" fill="#4365DE" stroke="#D7DCE0" strokeWidth="0.5" />
      <Path d="M7 12L11 16L17 7" stroke="#F5F7F8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function InactiveCheckbox() {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="11.75" fill="white" stroke="#D7DCE0" strokeWidth="0.5" />
    </Svg>
  )
}

export function CredentialSelectionCard({ credentials, selectedCredentialId, onSelect }: CredentialSelectionCardProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const { t } = useLingui()

  const selectedCredential = credentials.find((c) => c.id === selectedCredentialId)

  if (!selectedCredential) return null

  return (
    <>
      <CredentialCard
        credentialDisplay={selectedCredential.display.display}
        subtitle={selectedCredential.display.display.description}
        isSelectable={credentials.length > 1}
        onPress={() => setIsSheetOpen(true)}
        rightElement={<HeroIcons.Interaction size={24} color="$grey-600" />}
      />
      <FloatingSheet isOpen={isSheetOpen} setIsOpen={setIsSheetOpen}>
        <YStack pb="$4" px="$4">
          {/* Draggable Lip */}
          <Stack ai="center" pt="$3" pb="$1">
            <Stack w={32} h={4} br="$2" bg="$grey-200" />
          </Stack>

          <YStack gap="$4">
            <Heading textAlign="left" fontSize={24} fontWeight="600" lineHeight={36} textTransform="none">
              <Trans id="credentialSelection.sheetTitle" comment="Title for the credential selection sheet">
                Select Credential
              </Trans>
            </Heading>

            <YStack gap="$4">
              {credentials.map((cred) => (
                <CredentialCard
                  key={cred.id}
                  credentialDisplay={cred.display.display}
                  subtitle={cred.display.display.description}
                  isSelectable={true}
                  onPress={() => {
                    onSelect(cred.id)
                    setIsSheetOpen(false)
                  }}
                  rightElement={cred.id === selectedCredentialId ? <ActiveCheckbox /> : <InactiveCheckbox />}
                />
              ))}
            </YStack>

            <Pressable onPress={() => setIsSheetOpen(false)}>
              <YStack ai="center" py="$2">
                <Heading fontSize={16} fontWeight="600" color="#6D7581" textTransform="none">
                  {t(commonMessages.close)}
                </Heading>
              </YStack>
            </Pressable>
          </YStack>
        </YStack>
      </FloatingSheet>
    </>
  )
}
