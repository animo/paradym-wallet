import { Trans, useLingui } from '@lingui/react/macro'
import type { Ts12TransactionDataEntry } from '@package/agent'
import { Heading, HeroIcons, MessageBox, TableContainer, TableRow, YStack } from '@package/ui'
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
              }
            }
            return null
          })
          .filter((item): item is NonNullable<typeof item> => item !== null)

        return (
          <YStack gap="$4">
            <YStack px="$4" gap="$4">
              <Heading>
                {uiLabels?.title ?? (
                  <Trans id="ts12.defaultTitle" comment="Default title for TS12 transaction">
                    Review Transaction
                  </Trans>
                )}
              </Heading>

              {uiLabels?.securityHint && (
                <MessageBox
                  variant="light"
                  icon={<HeroIcons.InformationCircleFilled />}
                  message={uiLabels.securityHint}
                  collapsible
                />
              )}
            </YStack>

            <YStack mt="$2" px="$4">
              <TableContainer>
                {claimsToDisplay.map((claim, idx) => (
                  <TableRow
                    key={idx}
                    variant="horizontal"
                    attributes={claim.label}
                    values={claim.value}
                    isLastRow={idx === claimsToDisplay.length - 1}
                  />
                ))}
              </TableContainer>
            </YStack>
          </YStack>
        )
      }}
    />
  )
}
