import type { ResolvedTs12Metadata } from '@animo-id/eudi-wallet-functionality'
import { useLingui } from '@lingui/react/macro'
import type { getTs12TransactionDataTypes } from '@package/agent'
import {
  AnimatedStack,
  FloatingSheet,
  Heading,
  HeroIcons,
  Paragraph,
  ScrollView,
  Stack,
  TableContainer,
  TableRow,
  useScaleAnimation,
  XStack,
  YStack,
} from '@package/ui'
import { useState } from 'react'

interface TransactionDataTypesSheetProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  transactionDataTypes: Awaited<ReturnType<typeof getTs12TransactionDataTypes>>
  credentialId: string
  embedded?: boolean
}

export function TransactionDataTypesSheet({
  isOpen,
  setIsOpen,
  transactionDataTypes,
  credentialId,
  embedded = false,
}: TransactionDataTypesSheetProps) {
  const { i18n } = useLingui()
  const currentLocale = i18n.locale

  const content = (
    <YStack gap="$4">
      {Object.entries(transactionDataTypes).map(([type, subtypes]) =>
        Object.entries(subtypes).map(([subtype, metaForIds]) => {
          const meta = metaForIds[credentialId]
          if (!meta) return null

          const title =
            meta.ui_labels.transaction_title?.find((l) => l.locale === currentLocale)?.value ??
            meta.ui_labels.transaction_title?.find((l) => l.locale.startsWith(currentLocale.split('-')[0]))?.value ??
            meta.ui_labels.transaction_title?.[0]?.value ??
            type

          return (
            <TransactionTypeAccordion
              key={`${type}-${subtype}`}
              title={title}
              type={type}
              subtype={subtype}
              meta={meta}
              currentLocale={currentLocale}
            />
          )
        })
      )}
    </YStack>
  )

  if (embedded) {
    return content
  }

  return (
    <FloatingSheet isOpen={isOpen} setIsOpen={setIsOpen}>
      <Stack p="$4" gap="$4" maxHeight="80%">
        <Stack flexDirection="row" jc="space-between" ai="center">
          <Heading color="$grey-900" heading="h2">
            Supported Transactions
          </Heading>
          <Stack br="$12" p="$2" bg="$grey-50" onPress={() => setIsOpen(false)}>
            <HeroIcons.X size={16} strokeWidth={2.5} color="$grey-500" />
          </Stack>
        </Stack>
        <Stack borderBottomWidth="$0.5" borderColor="$grey-100" />
        <ScrollView>{content}</ScrollView>
      </Stack>
    </FloatingSheet>
  )
}

function TransactionTypeAccordion({
  title,
  type,
  subtype,
  meta,
  currentLocale,
}: {
  title: string
  type: string
  subtype: string
  meta: ResolvedTs12Metadata
  currentLocale: string
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation()

  const claimsToDisplay = meta.claims
    .map((claimDef) => {
      const label =
        claimDef.display.find((d) => d.locale === currentLocale)?.name ??
        claimDef.display.find((d) => d.locale?.startsWith(currentLocale.split('-')[0]))?.name ??
        claimDef.display[0].name

      return {
        label,
        path: claimDef.path.join('/'),
      }
    })
    .filter((item) => item !== null)

  const uiLabels = (
    [
      { key: 'transaction_title', label: 'Title' },
      { key: 'affirmative_action_label', label: 'Affirmative Action' },
      { key: 'denial_action_label', label: 'Denial Action' },
      { key: 'security_hint', label: 'Security Hint' },
    ] as const
  )
    .map(({ key, label }) => {
      const value =
        meta.ui_labels[key]?.find((l) => l.locale === currentLocale)?.value ??
        meta.ui_labels[key]?.find((l) => l.locale?.startsWith(currentLocale.split('-')[0]))?.value ??
        meta.ui_labels[key]?.[0]?.value

      return value ? { label, value } : null
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  return (
    <YStack bg="$white" br="$4" borderWidth={1} borderColor="$grey-200" overflow="hidden">
      <AnimatedStack
        onPress={() => setIsExpanded(!isExpanded)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={pressStyle}
        p="$4"
        bg="$grey-50"
        flexDirection="row"
        jc="space-between"
        ai="center"
      >
        <YStack f={1} gap="$1.5">
          <Heading heading="sub2" color="$grey-900">
            {title}
          </Heading>
          <XStack gap="$2" ai="center" flexWrap="wrap">
            <Paragraph variant="annotation" color="$grey-700" fontWeight="$medium">
              {type}
            </Paragraph>
            {subtype ? (
              <Paragraph variant="annotation" color="$grey-500">
                {subtype}
              </Paragraph>
            ) : null}
          </XStack>
        </YStack>
        {isExpanded ? (
          <HeroIcons.ChevronUp color="$grey-500" size={20} />
        ) : (
          <HeroIcons.ChevronDown color="$grey-500" size={20} />
        )}
      </AnimatedStack>

      {isExpanded && (
        <YStack p="$4" gap="$4" borderTopWidth={1} borderTopColor="$grey-200">
          <YStack gap="$2">
            <Heading heading="sub2" color="$grey-700">
              Details
            </Heading>
            <TableContainer>
              <TableRow variant="horizontal" attributes="Type" values={type} isLastRow={!subtype} />
              {subtype ? <TableRow variant="horizontal" attributes="Subtype" values={subtype} isLastRow /> : null}
            </TableContainer>
          </YStack>

          {claimsToDisplay.length > 0 && (
            <YStack gap="$2">
              <Heading heading="sub2" color="$grey-700">
                Claims
              </Heading>
              <TableContainer>
                {claimsToDisplay.map((claim, idx) => (
                  <TableRow
                    key={idx}
                    attributes={claim.label}
                    values={
                      <Paragraph variant="annotation" color="$grey-500">
                        {claim.path}
                      </Paragraph>
                    }
                    isLastRow={idx === claimsToDisplay.length - 1}
                  />
                ))}
              </TableContainer>
            </YStack>
          )}

          {uiLabels.length > 0 && (
            <YStack gap="$2">
              <Heading heading="sub2" color="$grey-700">
                UI Labels
              </Heading>
              <TableContainer>
                {uiLabels.map((item, idx) => (
                  <TableRow
                    key={idx}
                    variant="horizontal"
                    attributes={item.label}
                    values={item.value}
                    isLastRow={idx === uiLabels.length - 1}
                  />
                ))}
              </TableContainer>
            </YStack>
          )}
        </YStack>
      )}
    </YStack>
  )
}
