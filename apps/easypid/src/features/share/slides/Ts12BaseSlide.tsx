import type { ResolvedTs12Metadata } from '@animo-id/eudi-wallet-functionality'
import type { SdJwtVcRecord } from '@credo-ts/core'
import { useAppAgent } from '@easypid/agent'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  type CredentialForDisplay,
  type CredentialForDisplayId,
  type FormattedSubmissionEntrySatisfied,
  getCredentialForDisplay,
  type Ts12TransactionDataEntry,
} from '@package/agent'
import { DualResponseButtons, useWizard } from '@package/app'
import { commonMessages } from '@package/translations'
import { Heading, Paragraph, Spinner, YStack } from '@package/ui'
import { useEffect, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { CredentialSelectionCard } from '../components/CredentialSelectionCard'

export function getValueFromPath(obj: unknown, path: string[]) {
  return path.reduce((o, k) => (o as Record<string, unknown> | null)?.[k], obj)
}

export const getAdditionalPayload = (responseMode?: string) => ({
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

export interface LoadedCredential {
  id: CredentialForDisplayId
  record: SdJwtVcRecord
  display: CredentialForDisplay
}

export const useTs12CredentialLoading = (
  possibleCredentialIds: string[],
  entry: Ts12TransactionDataEntry,
  responseMode?: string,
  onCredentialSelect?: (credentialId: string, additionalPayload: object | undefined) => void,
  selectedCredentialId?: string | null,
  setSelectedCredentialId?: (id: string) => void
) => {
  const { agent } = useAppAgent()
  const { t } = useLingui()
  const [loadedCredentials, setLoadedCredentials] = useState<LoadedCredential[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [displayMetadata, setDisplayMetadata] = useState<ResolvedTs12Metadata | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Only show loading if we don't have credentials yet
        if (loadedCredentials.length === 0) {
          setIsLoading(true)
        }

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
          // If we already have a selection, just update the metadata
          if (selectedCredentialId && entry.metaForIds[selectedCredentialId]) {
            setDisplayMetadata(entry.metaForIds[selectedCredentialId])
          } else {
            // Otherwise select the first one
            const first = validCredentials[0]
            setSelectedCredentialId?.(first.id)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [possibleCredentialIds, entry, agent, t, onCredentialSelect, responseMode])

  return { loadedCredentials, isLoading, error, displayMetadata, setDisplayMetadata }
}

interface Ts12BaseSlideProps {
  entry: Ts12TransactionDataEntry
  onCredentialSelect?: (credentialId: string, additionalPayload: object | undefined) => void
  responseMode?: string
  selectedCredentialId?: string
  renderContent: (props: {
    loadedCredentials: LoadedCredential[]
    selectedCredentialId: string | null
    displayMetadata: ResolvedTs12Metadata
    onCredentialSelect: (id: string) => void
    uiLabels: { title?: string; affirmative: string; denial: string; securityHint?: string }
  }) => React.ReactNode
}

export function Ts12BaseSlide({
  entry,
  onCredentialSelect,
  responseMode,
  selectedCredentialId: initialSelectedCredentialId,
  renderContent,
}: Ts12BaseSlideProps) {
  const { onNext, onCancel } = useWizard()
  const { t, i18n } = useLingui()
  const [selectedCredentialId, setSelectedCredentialId] = useState<string | null>(initialSelectedCredentialId ?? null)

  const possibleCredentialIds = useMemo(() => {
    const allCredentials = entry.formattedSubmissions.flatMap((s) =>
      s.isSatisfied ? (s as FormattedSubmissionEntrySatisfied).credentials : []
    )

    allCredentials.sort((a, b) => b.credential.createdAt.getTime() - a.credential.createdAt.getTime())

    const seen = new Set<string>()
    return allCredentials.reduce<string[]>((acc, c) => {
      if (!seen.has(c.credential.id)) {
        seen.add(c.credential.id)
        acc.push(c.credential.id)
      }
      return acc
    }, [])
  }, [entry])

  const { loadedCredentials, isLoading, error, displayMetadata, setDisplayMetadata } = useTs12CredentialLoading(
    possibleCredentialIds,
    entry,
    responseMode,
    onCredentialSelect,
    selectedCredentialId,
    setSelectedCredentialId
  )

  const currentLocale = i18n.locale

  const uiLabels = useMemo(() => {
    if (!displayMetadata) return null
    const getLabel = (labels?: Array<{ locale: string; value: string }>) => {
      if (!labels) return undefined
      return (
        labels.find((l) => l.locale === currentLocale)?.value ??
        labels.find((l) => l.locale.startsWith(currentLocale.split('-')[0]))?.value ??
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

  const handleCredentialSelect = (id: string) => {
    setSelectedCredentialId(id)
    onCredentialSelect?.(id, getAdditionalPayload(responseMode))
    setDisplayMetadata(entry.metaForIds[id])
  }

  if (isLoading) {
    return (
      <YStack fg={1} jc="center" ai="center">
        <Spinner />
      </YStack>
    )
  }

  if (error || !displayMetadata || !uiLabels) {
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
      <YStack fg={1}>
        {renderContent({
          loadedCredentials,
          selectedCredentialId,
          displayMetadata,
          onCredentialSelect: handleCredentialSelect,
          uiLabels,
        })}

        <YStack gap="$2" mt="$4">
          <Heading heading="sub2">
            <Trans id="ts12.selectedCredential" comment="Label above the selected credential in TS12 slides">
              Selected Credential
            </Trans>
          </Heading>
          <CredentialSelectionCard
            credentials={loadedCredentials}
            selectedCredentialId={selectedCredentialId}
            onSelect={handleCredentialSelect}
          />
        </YStack>
        <YStack h="$4" />
      </YStack>

      <YStack btw="$0.5" borderColor="$grey-200" py="$4" mx="$-4" px="$4" bg="$background">
        <DualResponseButtons
          align="horizontal"
          acceptText={uiLabels.affirmative}
          declineText={uiLabels.denial}
          onAccept={() => onNext()}
          onDecline={() => onCancel()}
          isLoading={false}
        />
      </YStack>
    </YStack>
  )
}
