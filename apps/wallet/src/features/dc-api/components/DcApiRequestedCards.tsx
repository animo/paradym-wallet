import { formatPredicate } from '@app/utils/formatePredicate'
import { getUnmetAttributeMessages } from '@app/utils/unmetAttributeMessages'
// Deep imports throughout: the `@package/ui` barrel pulls in the whole kit, and this bundle is
// separate from the app's.
import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Heading } from '@package/ui/base/Headings'
import { Paragraph } from '@package/ui/base/Paragraph'
import { Stack, XStack, YStack } from '@package/ui/base/Stacks'
import { AttributeListItem } from '@package/ui/components/AttributeListItem'
import { HeroIcons } from '@package/ui/content/Icon'
import { Image } from '@package/ui/content/Image'
import { sanitizeString } from '@package/utils'
import type {
  CredentialRecord,
  FormattedAttribute,
  FormattedSubmission,
  FormattedSubmissionEntryNotSatisfied,
  FormattedSubmissionEntryPartialMatch,
  FormattedSubmissionEntrySatisfied,
  FormattedSubmissionEntrySatisfiedCredential,
} from '@paradym/wallet-sdk'
import {
  getClosestPartialMatch,
  getDisclosedAttributeNamesForDisplay,
  getRequestedAttributeNamesForDisplay,
} from '@paradym/wallet-sdk/display/common'
import { useState } from 'react'
import { dcApiMessages as messages } from '../messages'

/**
 * The cards a request would be answered with, and the attributes they would disclose.
 *
 * The app's `RequestedAttributesSection` navigates to the values behind each card. The request UI is
 * a single sheet with no navigation, so a card expands in place instead.
 */
export function DcApiRequestedCards({ submission }: { submission: FormattedSubmission }) {
  const { t } = useLingui()

  const satisfied = submission.entries.filter((entry): entry is FormattedSubmissionEntrySatisfied => entry.isSatisfied)
  const unsatisfied = submission.entries.filter(
    (entry): entry is FormattedSubmissionEntryNotSatisfied => !entry.isSatisfied
  )
  // The user has a card of the requested type for these, it just lacks some requested attributes.
  const partiallySatisfied = unsatisfied.filter((entry) => entry.partialMatches.length > 0)
  const unavailable = unsatisfied.filter((entry) => entry.partialMatches.length === 0)

  if (submission.entries.length === 0) {
    return <Paragraph color="$danger-500">{t(messages.nothingRequested)}</Paragraph>
  }

  const unavailableHeading = t(commonMessages.unavailableCardsHeading)
  const unmetAttributeMessages = getUnmetAttributeMessages(submission)

  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Heading heading="sub2">
          {satisfied.length > 0
            ? t(commonMessages.requestedCardsHeading)
            : partiallySatisfied.length > 0
              ? t(unmetAttributeMessages.heading)
              : unavailableHeading}
        </Heading>
        <Paragraph>
          {t(
            unsatisfied.length === 0
              ? commonMessages.allRequestedCardsDescription
              : unavailable.length === 0
                ? unmetAttributeMessages.description
                : satisfied.length === 0 && partiallySatisfied.length === 0
                  ? commonMessages.noRequestedCardsDescription
                  : commonMessages.someRequestedCardsMissingDescription
          )}
        </Paragraph>
      </YStack>

      {/* The first credential is the one that will be shared — there is no selection here. */}
      {satisfied.map((entry) => (
        <RequestedCard key={entry.inputDescriptorId} credential={entry.credentials[0]} />
      ))}

      {partiallySatisfied.length > 0 && (
        <>
          {satisfied.length > 0 && <Heading heading="sub2">{t(unmetAttributeMessages.heading)}</Heading>}
          {partiallySatisfied.map((entry) => (
            <PartiallyMatchingCard key={entry.inputDescriptorId} entry={entry} />
          ))}
        </>
      )}

      {unavailable.length > 0 && (
        <>
          {(satisfied.length > 0 || partiallySatisfied.length > 0) && (
            <Heading heading="sub2">{unavailableHeading}</Heading>
          )}
          {unavailable.map((entry) => (
            <Card
              key={entry.inputDescriptorId}
              name={entry.name ?? t(commonMessages.unknown)}
              backgroundColor="$grey-800"
              textColor="$background"
              attributeNames={formatAttributePaths(entry.requestedAttributePaths)}
            />
          ))}
        </>
      )}
    </YStack>
  )
}

const formatAttributePaths = (
  paths: FormattedSubmissionEntryNotSatisfied['requestedAttributePaths'],
  record?: CredentialRecord
) =>
  getRequestedAttributeNamesForDisplay(paths, record).map((path) =>
    typeof path === 'string' ? path : formatPredicate(path)
  )

/** The user's own card of the requested type, with the requested attributes it lacks in red. */
function PartiallyMatchingCard({ entry }: { entry: FormattedSubmissionEntryNotSatisfied }) {
  const { t } = useLingui()
  // Always defined, the entry has partial matches
  const { credential, missingAttributePaths, mismatchedAttributePaths } = getClosestPartialMatch(
    entry
  ) as FormattedSubmissionEntryPartialMatch
  const { display } = credential
  // Both are marked red, the wording above the cards tells which it is
  const missingAttributeNames = formatAttributePaths(
    [...missingAttributePaths, ...mismatchedAttributePaths],
    credential.record
  )

  return (
    <Card
      name={display.name ?? entry.name ?? t(commonMessages.unknown)}
      backgroundColor={display.backgroundColor}
      backgroundImage={display.backgroundImage?.url}
      issuerImage={display.issuer.logo?.url}
      textColor={display.textColor}
      attributeNames={Array.from(
        new Set([...formatAttributePaths(entry.requestedAttributePaths, credential.record), ...missingAttributeNames])
      )}
      missingAttributeNames={missingAttributeNames}
    />
  )
}

function RequestedCard({ credential }: { credential: FormattedSubmissionEntrySatisfiedCredential }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { t } = useLingui()
  const { display } = credential.credential

  return (
    <Card
      name={display.name ?? t(commonMessages.unknown)}
      backgroundColor={display.backgroundColor}
      backgroundImage={display.backgroundImage?.url}
      issuerImage={display.issuer.logo?.url}
      textColor={display.textColor}
      attributeNames={getDisclosedAttributeNamesForDisplay(credential).map((name) =>
        typeof name === 'string' ? name : formatPredicate(name)
      )}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded((expanded) => !expanded)}
    >
      <YStack gap="$3">
        {credential.disclosed.attributes.map((attribute) => (
          <AttributeRow key={attribute.path.join('.')} attribute={attribute} />
        ))}
      </YStack>
    </Card>
  )
}

/** Two attribute names to a row. */
function toRows(names: string[]) {
  const rows: Array<[string, string | undefined]> = []
  for (let index = 0; index < names.length; index += 2) {
    rows.push([names[index], names[index + 1]])
  }
  return rows
}

type CardProps = {
  name: string
  backgroundColor?: string
  backgroundImage?: string
  issuerImage?: string
  textColor?: string
  attributeNames: string[]
  /** Entries of `attributeNames` the card lacks, shown in red. */
  missingAttributeNames?: string[]
  isExpanded?: boolean
  onToggle?: () => void
  children?: React.ReactNode
}

function Card({
  name,
  backgroundColor,
  backgroundImage,
  issuerImage,
  textColor,
  attributeNames,
  missingAttributeNames,
  isExpanded = false,
  onToggle,
  children,
}: CardProps) {
  const isMissing = (name: string) => missingAttributeNames?.includes(name) ?? false

  // Two columns of attribute names, the way the app shows them on the card: what the card holds
  // first, then what it lacks, each group starting on a row of its own.
  const columns = [
    ...toRows(attributeNames.filter((name) => !isMissing(name))),
    ...toRows(attributeNames.filter(isMissing)),
  ]

  return (
    <Stack
      br="$6"
      borderWidth="$0.5"
      borderColor="$borderTranslucent"
      overflow="hidden"
      transition={onToggle ? 'quick' : undefined}
      pressStyle={onToggle ? { scale: 0.98 } : undefined}
      onPress={onToggle}
      role={onToggle ? 'button' : undefined}
      aria-label={`Shared attributes from ${name.toLocaleUpperCase()}`}
    >
      <Stack px="$4" py="$3" pos="relative" bg={backgroundColor ?? '$grey-900'}>
        {backgroundImage && (
          <Stack pos="absolute" top={0} left={0} right={0} bottom={0}>
            <Image src={backgroundImage} contentFit="cover" height="100%" width="100%" />
          </Stack>
        )}
        <XStack ai="center" jc="space-between" gap="$2">
          <Heading
            heading="sub2"
            fontSize={14}
            fontWeight="$bold"
            numberOfLines={1}
            f={1}
            color={textColor ?? '$grey-200'}
          >
            {name.toLocaleUpperCase()}
          </Heading>
          {issuerImage && <Image circle src={issuerImage} width={36} height={36} />}
        </XStack>
      </Stack>

      <YStack px="$4" pt="$3" pb="$4" gap="$3" bg="$background">
        {isExpanded ? (
          children
        ) : (
          <YStack gap="$2" pr="$4">
            {columns.map(([first, second]) => (
              <XStack key={`${first}-${second}`} gap="$3">
                <Stack flexGrow={1} flexBasis={0}>
                  <AttributeListItem name={first} isMissing={isMissing(first)} />
                </Stack>
                <Stack flexGrow={1} flexBasis={0}>
                  {second && <AttributeListItem name={second} isMissing={isMissing(second)} />}
                </Stack>
              </XStack>
            ))}
          </YStack>
        )}

        {onToggle && (
          <XStack jc="flex-end">
            {isExpanded ? (
              <HeroIcons.ChevronUp size={20} color="$grey-500" />
            ) : (
              <HeroIcons.ChevronDown size={20} color="$grey-500" />
            )}
          </XStack>
        )}
      </YStack>
    </Stack>
  )
}

/**
 * One disclosed attribute, formatted the way the app's attribute screen formats it.
 *
 * The sheet has no screen to push nested attributes onto, so it goes one level deep: an object's
 * attributes are listed under its label, a list of plain values reads as one line, and anything
 * deeper is summarised by how many entries it has.
 */
function AttributeRow({ attribute, isNested = false }: { attribute: FormattedAttribute; isNested?: boolean }) {
  const { t } = useLingui()
  const label = attribute.label ?? sanitizeString(String(attribute.path.at(-1) ?? ''))

  // A list of one is its only entry, under the list's label — as the app's attribute screen does.
  if (attribute.type === 'array' && attribute.value.length === 1) {
    return <AttributeRow attribute={{ ...attribute.value[0], label: attribute.label }} isNested={isNested} />
  }

  if (attribute.type === 'object' && !isNested) {
    return (
      <YStack gap="$2">
        <Paragraph variant="sub" fontWeight="$medium">
          {label}
        </Paragraph>
        <YStack gap="$2" pl="$3" bw={0} blw="$0.5" borderColor="$grey-200">
          {attribute.value.map((nested, index) => (
            <AttributeRow key={`${nested.path.join('.')}-${index}`} attribute={nested} isNested />
          ))}
        </YStack>
      </YStack>
    )
  }

  if (attribute.type === 'image') {
    return (
      <XStack gap="$4" jc="space-between" ai="flex-start">
        <Paragraph variant="sub" flexShrink={1}>
          {label}
        </Paragraph>
        <Image src={attribute.value} width={48} height={48} contentFit="contain" />
      </XStack>
    )
  }

  const value =
    attribute.type === 'object' || attribute.type === 'array'
      ? attribute.value.every(isPlainValue)
        ? attribute.value.map((entry) => formatPlainValue(entry, t)).join(', ')
        : t(messages.entryCount(attribute.value.length))
      : formatPlainValue(attribute, t)

  return (
    <XStack gap="$4" jc="space-between" ai="flex-start">
      <Paragraph variant="sub" flexShrink={1}>
        {label}
      </Paragraph>
      <AttributeValue value={value} />
    </XStack>
  )
}

type PlainAttribute = Extract<FormattedAttribute, { type: 'string' | 'number' | 'boolean' | 'date' }>

const isPlainValue = (attribute: FormattedAttribute): attribute is PlainAttribute =>
  attribute.type === 'string' ||
  attribute.type === 'number' ||
  attribute.type === 'boolean' ||
  attribute.type === 'date'

/** A date arrives formatted already; a boolean reads as yes or no, as it does in the app. */
function formatPlainValue(attribute: PlainAttribute, t: ReturnType<typeof useLingui>['t']) {
  if (attribute.type === 'boolean') return t(attribute.value ? commonMessages.yes : commonMessages.no)
  return String(attribute.value)
}

/** Cut to two lines past 100 characters, the same threshold the app's attribute screen uses. */
function AttributeValue({ value }: { value: string }) {
  const { t } = useLingui()
  const [isExpanded, setIsExpanded] = useState(false)
  const isLong = value.length > 100

  return (
    <YStack flexShrink={1} ai="flex-end" gap="$1">
      <Paragraph fontWeight="$medium" ta="right" numberOfLines={isLong && !isExpanded ? 2 : undefined}>
        {value}
      </Paragraph>
      {isLong && (
        <Paragraph variant="annotation" color="$grey-500" onPress={() => setIsExpanded((expanded) => !expanded)}>
          {t(isExpanded ? commonMessages.showLess : commonMessages.showMore)}
        </Paragraph>
      )}
    </YStack>
  )
}
