import { Trans, useLingui } from '@lingui/react/macro'
import type { Ts12TransactionDataEntry } from '@package/agent'
import { Heading, Paragraph, YStack } from '@package/ui'
import { getValueFromPath, Ts12BaseSlide } from './Ts12BaseSlide'

interface Ts12TransactionSlideProps {
  entry: Ts12TransactionDataEntry
  onCredentialSelect?: (credentialId: string, additionalPayload: object | undefined) => void
  responseMode?: string
  selectedCredentialId?: string
}

export function Ts12TransactionSlide({
  entry,
  onCredentialSelect,
  responseMode,
  selectedCredentialId,
}: Ts12TransactionSlideProps) {
  const { i18n } = useLingui()
  const currentLocale = i18n.locale

  return (
    <Ts12BaseSlide
      entry={entry}
      onCredentialSelect={onCredentialSelect}
      responseMode={responseMode}
      selectedCredentialId={selectedCredentialId}
      renderContent={({ displayMetadata, uiLabels }) => {
        const claimsToDisplay = displayMetadata.claims
          .filter((c) => c.visualisation !== 4)
          .sort((a, b) => a.visualisation - b.visualisation)
          .map((claimDef) => {
            const label =
              claimDef.display.find((d) => d.locale === currentLocale)?.name ??
              claimDef.display.find((d) => d.locale?.startsWith(currentLocale.split('-')[0]))?.name ??
              claimDef.display[0].name

            const value = getValueFromPath(entry, claimDef.path)

            if (value !== undefined) {
              return {
                label,
                value: String(value),
                visualisation: claimDef.visualisation,
              }
            }
            return null
          })
          .filter((item): item is NonNullable<typeof item> => item !== null)

        return (
          <YStack gap="$4">
            <Heading>
              {uiLabels?.title ?? (
                <Trans id="ts12.defaultTitle" comment="Default title for TS12 transaction">
                  Review Transaction
                </Trans>
              )}
            </Heading>

            {uiLabels?.securityHint && (
              <Paragraph variant="sub" color="$grey-600">
                {uiLabels.securityHint}
              </Paragraph>
            )}

            <YStack gap="$4" mt="$2">
              {claimsToDisplay.map((claim, idx) => (
                <YStack key={idx} gap="$1">
                  <Paragraph
                    variant={claim.visualisation === 1 ? 'normal' : 'sub'}
                    fontWeight="bold"
                    color="$grey-700"
                  >
                    {claim.label}
                  </Paragraph>
                  <Paragraph
                    variant={claim.visualisation === 1 ? 'normal' : 'normal'}
                    fontWeight={claim.visualisation === 1 ? 'bold' : 'regular'}
                  >
                    {claim.value}
                  </Paragraph>
                </YStack>
              ))}
            </YStack>
          </YStack>
        )
      }}
    />
  )
}
