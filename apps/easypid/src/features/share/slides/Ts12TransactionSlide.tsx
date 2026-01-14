import type { ResolvedTs12Metadata } from '@animo-id/eudi-wallet-functionality'
import type { SdJwtVcRecord } from '@credo-ts/core'
import { useAppAgent } from '@easypid/agent'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  type CredentialForDisplay,
  type CredentialForDisplayId,
  getCredentialForDisplay,
  type Ts12TransactionDataEntry,
} from '@package/agent'
import { CardWithAttributes, DualResponseButtons, useWizard } from '@package/app'
import { commonMessages } from '@package/translations'
import { Heading, Paragraph, ScrollView, Spinner, YStack } from '@package/ui'
import { useEffect, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

interface Ts12TransactionSlideProps {
  entry: Ts12TransactionDataEntry
  onCredentialSelect?: (credentialId: string, additionalPayload: object | undefined) => void
  responseMode?: string
}

interface LoadedCredential {
  id: CredentialForDisplayId
  record: SdJwtVcRecord
  display: CredentialForDisplay
}

function getValueFromPath(obj: unknown, path: string[]) {
  return path.reduce((o, k) => (o as Record<string, unknown> | null)?.[k], obj)
}

const getAdditionalPayload = (responseMode?: string) => ({
  // FIXME: Truly detect these facts https://github.com/eu-digital-identity-wallet/eudi-doc-standards-and-technical-specifications/blob/main/docs/technical-specifications/ts12-electronic-payments-SCA-implementation-with-wallet.md#36-presentation-response
  amr: [
    {
      knowledge: 'pin_6_or_more_digits',
    },
    {
      possession: 'key_in_local_native_wscd',
    },
    {
      inherence: 'fingerprint_device',
    },
  ],
  jti: uuidv4(),
  response_mode: responseMode,
})

export function Ts12TransactionSlide({ entry, onCredentialSelect, responseMode }: Ts12TransactionSlideProps) {
  const { onNext, onCancel } = useWizard()
  const { t, i18n } = useLingui()
  const { agent } = useAppAgent()
  const [displayMetadata, setDisplayMetadata] = useState<ResolvedTs12Metadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCredentialId, setSelectedCredentialId] = useState<string | null>(null)
  const [loadedCredentials, setLoadedCredentials] = useState<LoadedCredential[]>([])

  const possibleCredentialIds = useMemo(
    () => entry.formattedSubmissions.flatMap((s) => (s.isSatisfied ? s.credentials.map((c) => c.credential.id) : [])),
    [entry]
  )

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        if (!possibleCredentialIds || possibleCredentialIds.length === 0) {
          throw new Error('No matching credentials found for this transaction type')
        }

        const results = await Promise.all(
          possibleCredentialIds.map(async (credentialId) => {
            // Only SD-JWT is supported for TS12
            const record = await agent.sdJwtVc?.getById(credentialId.replace('sd-jwt-vc-', '')).catch(() => null)
            if (!record) return null

            return {
              id: credentialId as CredentialForDisplayId,
              record,
              display: getCredentialForDisplay(record),
            }
          })
        )

        const validCredentials = results.filter((c): c is LoadedCredential => c !== null)
        setLoadedCredentials(validCredentials)

        if (validCredentials.length > 0) {
          const first = validCredentials[0]
          if (first && selectedCredentialId !== first.id) {
            setSelectedCredentialId(first.id)
            onCredentialSelect?.(first.id, getAdditionalPayload(responseMode))
            setDisplayMetadata(entry.metaForIds[first.id])
          }
        } else {
          throw new Error('No valid credentials found for this transaction')
        }
      } catch (e) {
        console.error('Failed to load TS12 data', e)
        setError(t(commonMessages.error))
      } finally {
        setIsLoading(false)
      }
    }

    void loadData()
  }, [possibleCredentialIds, entry, agent, t, onCredentialSelect, responseMode, selectedCredentialId])

  const currentLocale = i18n.locale

  const uiLabels = useMemo(() => {
    if (!displayMetadata) return null
    const getLabel = (labels?: Array<{ lang: string; value: string }>) => {
      if (!labels) return undefined
      return (
        labels.find((l) => l.lang === currentLocale)?.value ??
        labels.find((l) => l.lang.startsWith(currentLocale.split('-')[0]))?.value ??
        labels[0]?.value
      )
    }

    return {
      title: getLabel(displayMetadata.ui_labels.transaction_title),
      affirmative: getLabel(displayMetadata.ui_labels.affirmative_action_label) ?? t(commonMessages.continue),
      denial: getLabel(displayMetadata.ui_labels.denial_action_label) ?? t(commonMessages.stop),
      securityHint: getLabel(displayMetadata.ui_labels.security_hint),
    }
  }, [displayMetadata, currentLocale, t])

  const claimsToDisplay = useMemo(() => {
    if (!displayMetadata) return []

    const sortedClaims = displayMetadata.claims
      .filter((c) => c.visualisation !== 4)
      .sort((a, b) => a.visualisation - b.visualisation)

    const result: Array<{ label: string; value: string; visualisation: number }> = []

    console.log(entry.payload)
    for (const claimDef of sortedClaims) {
      const label =
        claimDef.display.find((d) => d.locale === currentLocale)?.name ??
        claimDef.display.find((d) => d.locale?.startsWith(currentLocale.split('-')[0]))?.name ??
        claimDef.display[0].name

      const value = getValueFromPath(entry, claimDef.path)
      console.log(label, claimDef.path, value)

      if (value !== undefined) {
        result.push({
          label,
          value: String(value),
          visualisation: claimDef.visualisation,
        })
      }
    }

    return result
  }, [displayMetadata, entry, currentLocale])
  console.log(claimsToDisplay)

  if (isLoading) {
    return (
      <YStack fg={1} jc="center" ai="center">
        <Spinner />
      </YStack>
    )
  }

  if (error || !displayMetadata) {
    return (
      <YStack fg={1} jc="center" ai="center" gap="$4">
        <Paragraph>{error ?? t(commonMessages.error)}</Paragraph>
        <DualResponseButtons
          align="horizontal"
          acceptText={t(commonMessages.retry)}
          declineText={t(commonMessages.close)}
          onAccept={() => window.location.reload()}
          onDecline={onCancel}
        />
      </YStack>
    )
  }

  return (
    <YStack fg={1} jc="space-between">
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
              <Paragraph variant={claim.visualisation === 1 ? 'normal' : 'sub'} fontWeight="bold" color="$grey-700">
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

        {loadedCredentials.length > 0 && (
          <YStack gap="$2">
            <Heading heading="sub2">
              <Trans id="ts12.selectCard" comment="Heading for card selection">
                Select Card
              </Trans>
            </Heading>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: '$4', px: '$1' }}
            >
              {loadedCredentials.map((cred) => (
                <YStack
                  key={cred.id}
                  onPress={() => {
                    setSelectedCredentialId(cred.id)
                    onCredentialSelect?.(cred.id, getAdditionalPayload(responseMode))
                    setDisplayMetadata(entry.metaForIds[cred.id])
                  }}
                  opacity={selectedCredentialId === cred.id ? 1 : 0.5}
                  scale={selectedCredentialId === cred.id ? 1 : 0.9}
                  animation="quick"
                >
                  <CardWithAttributes
                    id={cred.id}
                    name={cred.display.display.name}
                    backgroundImage={cred.display.display.backgroundImage}
                    backgroundColor={cred.display.display.backgroundColor}
                    issuerImage={cred.display.display.issuer.logo}
                    textColor={cred.display.display.textColor}
                    formattedDisclosedAttributes={[]}
                    disclosedPayload={{}}
                  />
                </YStack>
              ))}
            </ScrollView>
          </YStack>
        )}
      </YStack>

      <YStack btw="$0.5" borderColor="$grey-200" py="$4" mx="$-4" px="$4" bg="$background">
        <DualResponseButtons
          align="horizontal"
          acceptText={uiLabels?.affirmative ?? t(commonMessages.continue)}
          declineText={uiLabels?.denial ?? t(commonMessages.stop)}
          onAccept={() => onNext()}
          onDecline={() => onCancel()}
          isLoading={false}
        />
      </YStack>
    </YStack>
  )
}
