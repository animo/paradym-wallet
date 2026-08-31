import { formatPredicate } from '@app/utils/formatePredicate'
// Deep imports throughout: the `@package/ui` barrel pulls in the whole kit, and this bundle is
// separate from the app's.
import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Heading } from '@package/ui/base/Headings'
import { Paragraph } from '@package/ui/base/Paragraph'
import { Stack, XStack, YStack } from '@package/ui/base/Stacks'
import { HeroIcons } from '@package/ui/content/Icon'
import { Image } from '@package/ui/content/Image'
import { sanitizeString } from '@package/utils'
import type {
  FormattedAttribute,
  FormattedSubmission,
  FormattedSubmissionEntryNotSatisfied,
  FormattedSubmissionEntrySatisfied,
  FormattedSubmissionEntrySatisfiedCredential,
} from '@paradym/wallet-sdk'
import {
  getDisclosedAttributeNamesForDisplay,
  getUnsatisfiedAttributePathsForDisplay,
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

  if (submission.entries.length === 0) {
    return <Paragraph color="$danger-500">{t(messages.nothingRequested)}</Paragraph>
  }

  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Heading heading="sub2">
          {satisfied.length > 0
            ? t({ id: 'dcApi.cards.requestedHeading', message: 'REQUESTED CARDS' })
            : t({ id: 'dcApi.cards.unavailableHeading', message: 'UNAVAILABLE CARDS' })}
        </Heading>
        <Paragraph>
          {unsatisfied.length === 0
            ? t({ id: 'dcApi.cards.allSatisfied', message: 'The following cards will be shared.' })
            : satisfied.length === 0
              ? t({ id: 'dcApi.cards.noneSatisfied', message: `You don't have the requested card(s).` })
              : t({ id: 'dcApi.cards.someSatisfied', message: `You don't have all of the requested cards.` })}
        </Paragraph>
      </YStack>

      {/* The first credential is the one that will be shared — there is no selection here. */}
      {satisfied.map((entry) => (
        <RequestedCard key={entry.inputDescriptorId} credential={entry.credentials[0]} />
      ))}

      {unsatisfied.length > 0 && (
        <>
          {satisfied.length > 0 && (
            <Heading heading="sub2">
              {t({ id: 'dcApi.cards.unavailableHeading', message: 'UNAVAILABLE CARDS' })}
            </Heading>
          )}
          {unsatisfied.map((entry) => (
            <Card
              key={entry.inputDescriptorId}
              name={entry.name ?? t(commonMessages.unknown)}
              backgroundColor="$grey-800"
              textColor="$background"
              attributeNames={getUnsatisfiedAttributePathsForDisplay(entry.requestedAttributePaths).map((path) =>
                typeof path === 'string' ? path : formatPredicate(path)
              )}
            />
          ))}
        </>
      )}
    </YStack>
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

type CardProps = {
  name: string
  backgroundColor?: string
  backgroundImage?: string
  issuerImage?: string
  textColor?: string
  attributeNames: string[]
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
  isExpanded = false,
  onToggle,
  children,
}: CardProps) {
  // Two columns of attribute names, the way the app shows them on the card.
  const columns: Array<[string, string | undefined]> = []
  for (let index = 0; index < attributeNames.length; index += 2) {
    columns.push([attributeNames[index], attributeNames[index + 1]])
  }

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
              <XStack key={`${first}-${second}`} gap="$4" minHeight="$2">
                <Stack flexGrow={1} flexBasis={0}>
                  <Paragraph fontSize={15}>{sanitizeString(first)}</Paragraph>
                </Stack>
                <Stack flexGrow={1} flexBasis={0}>
                  <Paragraph fontSize={15}>{second ? sanitizeString(second) : ''}</Paragraph>
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

/** One disclosed attribute, with nested objects and arrays indented under their parent. */
function AttributeRow({ attribute, depth = 0 }: { attribute: FormattedAttribute; depth?: number }) {
  const label = attribute.label ?? sanitizeString(String(attribute.path.at(-1) ?? ''))

  if (attribute.type === 'object' || attribute.type === 'array') {
    return (
      <YStack gap="$2" pl={depth > 0 ? '$3' : undefined}>
        <Paragraph variant="sub" fontWeight="$medium">
          {label}
        </Paragraph>
        <YStack gap="$2" pl="$3" bw={0} blw="$0.5" borderColor="$grey-100">
          {attribute.value.map((nested, index) => (
            <AttributeRow key={`${nested.path.join('.')}-${index}`} attribute={nested} depth={depth + 1} />
          ))}
        </YStack>
      </YStack>
    )
  }

  return (
    <XStack gap="$4" pl={depth > 0 ? '$3' : undefined} jc="space-between" ai="flex-start">
      <Paragraph variant="sub" flexShrink={1}>
        {label}
      </Paragraph>
      {attribute.type === 'image' ? (
        <Image src={attribute.value} width={48} height={48} contentFit="contain" />
      ) : (
        <Paragraph fontWeight="$medium" ta="right" flexShrink={1}>
          {String(attribute.value)}
        </Paragraph>
      )}
    </XStack>
  )
}
