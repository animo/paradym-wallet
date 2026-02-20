import { type _t, Trans, useLingui } from '@lingui/react/macro'
import type {
  FormattedAttribute,
  FormattedAttributeArray,
  FormattedAttributeDate,
  FormattedAttributeNumber,
  FormattedAttributeObject,
  FormattedAttributePrimitive,
  FormattedAttributeString,
} from '@package/agent'
import { commonMessages } from '@package/translations'
import {
  FloatingSheet,
  Heading,
  HeroIcons,
  IconContainer,
  Image,
  Paragraph,
  type ScrollViewRefType,
  Stack,
  TableContainer,
  XStack,
  YStack,
} from '@package/ui'
import { sanitizeString } from '@package/utils'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import type { View } from 'react-native'
import { useHaptics } from '../hooks/useHaptics'

export type CredentialAttributesProps = {
  attributes: FormattedAttribute[]
  headerTitle?: string
  scrollRef?: React.RefObject<ScrollViewRefType | null>
}

const valueToPrimitive = (t: typeof _t, value: string | number | boolean) =>
  typeof value === 'boolean'
    ? value
      ? t(commonMessages.yes)
      : t(commonMessages.no)
    : typeof value === 'number'
      ? value.toString()
      : value

const useTruncatedValue = ({
  truncate,
  scrollRef,
}: {
  truncate?: boolean
  scrollRef?: React.RefObject<ScrollViewRefType | null>
}) => {
  const { t } = useLingui()

  const rowRef = useRef<View>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const scrollToRow = () => {
    const scrollNode = scrollRef?.current?.getNativeScrollRef?.()
    if (!rowRef.current || !scrollNode) return
    rowRef.current.measureLayout(
      scrollNode,
      (_left, top) => scrollRef?.current?.scrollTo({ y: top, animated: true }),
      () => {}
    )
  }

  return {
    onPress: truncate
      ? () => {
          if (isExpanded) {
            setIsExpanded(false)
            scrollToRow()
          } else {
            setIsExpanded(true)
          }
        }
      : undefined,
    truncate,
    isExpanded,
    rowRef,

    collapsibleButton: truncate ? (
      <XStack ai="center" gap="$1">
        {isExpanded ? (
          <HeroIcons.ChevronUp size={14} color="$grey-500" />
        ) : (
          <HeroIcons.ChevronDown size={14} color="$grey-500" />
        )}
        <Paragraph variant="annotation" color="$grey-500">
          {isExpanded ? t(commonMessages.showLess) : t(commonMessages.showMore)}
        </Paragraph>
      </XStack>
    ) : null,
  }
}

function isPrimitiveRow(item: FormattedAttribute): item is FormattedAttributePrimitive | FormattedAttributeArray {
  return (
    item.type === 'boolean' ||
    item.type === 'date' ||
    item.type === 'string' ||
    item.type === 'number' ||
    item.type === 'image' ||
    (item.type === 'array' &&
      item.value.length > 1 &&
      item.value.some(({ type }) => ['object', 'array'].includes(type)))
  )
}

export function CredentialAttributes({ attributes, headerTitle, scrollRef }: CredentialAttributesProps) {
  // Separate data into primitive values and objects at the parent level
  const primitiveItems = attributes.filter(isPrimitiveRow)
  const objectItems = attributes.filter(
    (item): item is FormattedAttributeArray | FormattedAttributeObject => !isPrimitiveRow(item)
  )

  if (!headerTitle && attributes.length === 1 && (attributes[0].type === 'object' || attributes[0].type === 'array')) {
    return (
      <YStack gap="$4">
        {attributes[0].label && <Heading heading="sub2">{attributes[0].label}</Heading>}

        <TableContainer>
          {attributes[0].value.map((item, index) => (
            <AnyRow
              key={`row-${index}-${item.path.join('.')}`}
              item={item}
              parentName={attributes[0].label}
              scrollRef={scrollRef}
            />
          ))}
        </TableContainer>
      </YStack>
    )
  }

  return (
    <YStack gap="$6">
      {primitiveItems.length > 0 && (
        <YStack gap="$4">
          {headerTitle && <Heading heading="sub2">{headerTitle}</Heading>}

          <TableContainer>
            {primitiveItems.map((item, index) => (
              <AnyRow key={`row-${index}-${item.path.join('.')}`} item={item} scrollRef={scrollRef} />
            ))}
          </TableContainer>
        </YStack>
      )}

      {objectItems.map((item, index) => (
        <YStack key={`object-${index}-${item.path.join('.')}`} gap="$4">
          {item.label && <Heading heading="sub2">{item.label}</Heading>}
          <TableContainer>
            {(item.type === 'array' &&
            item.value.length === 1 &&
            (item.value[0].type === 'object' || item.value[0].type === 'array')
              ? item.value[0].value
              : item.value
            ).map((value, valueIndex) => (
              <AnyRow
                key={`${index}-${valueIndex}-${value.path.join('.')}`}
                item={value}
                parentName={item.label}
                scrollRef={scrollRef}
              />
            ))}
          </TableContainer>
        </YStack>
      ))}
    </YStack>
  )
}

const AnyRow = ({
  item,
  parentName,
  scrollRef,
}: {
  item: FormattedAttribute
  parentName?: string
  scrollRef?: React.RefObject<ScrollViewRefType | null>
}) => {
  const { t } = useLingui()

  if (item.type === 'array' && item.value.length === 1) {
    return (
      <AnyRow
        item={{
          ...item.value[0],
          label: item.label,
        }}
        scrollRef={scrollRef}
        parentName={parentName}
      />
    )
  }

  if (
    item.label &&
    item.type === 'array' &&
    item.value.every(
      (value): value is FormattedAttributeNumber | FormattedAttributeDate | FormattedAttributeString =>
        value.type === 'number' || (value.type === 'string' && value.value.length < 100) || value.type === 'date'
    )
  ) {
    return (
      <MultiValueRow
        label={item.label}
        values={item.value.map((value) => valueToPrimitive(t, value.value))}
        description={item.description}
        scrollRef={scrollRef}
      />
    )
  }

  if (item.type === 'object' || item.type === 'array') {
    return <NestedRow parentName={parentName} item={item} />
  }

  if (item.type === 'image') {
    return <ImageRow label={item.label} value={item.value} />
  }

  // Check if label is a number or numeric string
  if (!item.label || !Number.isNaN(Number(item.label))) {
    return <NamelessValueRow value={valueToPrimitive(t, item.value)} scrollRef={scrollRef} />
  }

  return (
    <ValueRow
      label={item.label}
      value={valueToPrimitive(t, item.value)}
      description={item.description}
      scrollRef={scrollRef}
    />
  )
}

const NestedRow = ({ item, parentName }: { item: FormattedAttribute; parentName?: string }) => {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { withHaptics } = useHaptics()

  // For nested rows we want to show the index + 1 as label
  const lastPathItem = item.path[item.path.length - 1]
  const label =
    item.label ?? (typeof lastPathItem === 'string' ? sanitizeString(lastPathItem) : String(lastPathItem + 1))

  const onPress = withHaptics(() => {
    const params = new URLSearchParams({
      item: JSON.stringify(item),
    })

    if (parentName) params.set('parentName', parentName)

    router.push(`/credentials/${id}/nested?${params.toString()}`)
  })

  return (
    <XStack
      key={`object-array-${item.path.join('.')}`}
      borderBottomWidth={1}
      borderBottomColor="$tableBorderColor"
      backgroundColor="$tableBackgroundColor"
      gap="$1.5"
      px="$2.5"
      pl="$4"
      py="$2"
      jc="space-between"
      ai="center"
      w="100%"
      pressStyle={{
        backgroundColor: '$grey-100',
      }}
      onPress={onPress}
    >
      <Paragraph flexShrink={1} color="$grey-900">
        {label}
      </Paragraph>
      <IconContainer bg="$transparent" icon={<HeroIcons.ChevronRight size={20} />} />
    </XStack>
  )
}

const ImageRow = ({ label, value }: { label?: string; value: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { withHaptics } = useHaptics()

  const handleOpen = withHaptics(() => {
    setIsOpen(true)
  })

  return (
    <>
      <XStack
        bg="$tableBackgroundColor"
        px="$2.5"
        py="$2"
        borderBottomWidth={1}
        borderBottomColor="$tableBorderColor"
        ai="center"
        jc="space-between"
        onPress={handleOpen}
        pressStyle={{
          backgroundColor: '$grey-100',
        }}
      >
        <YStack>
          {label && (
            <Paragraph variant="annotation" color="$grey-600" fontWeight="$medium">
              {label}
            </Paragraph>
          )}
          <Paragraph color="$grey-900">
            <Trans id="common.tapToView" comment="Label shown on image rows prompting user to tap to view image">
              Tap to view
            </Trans>
          </Paragraph>
        </YStack>
        <YStack br="$2" overflow="hidden">
          <Image height={36} width={36} src={value} alt={label} />
        </YStack>
      </XStack>
      <FloatingSheet isOpen={isOpen} setIsOpen={setIsOpen}>
        <Stack p="$4" gap="$4">
          <XStack jc="space-between">
            <Heading color="$grey-900" heading="h2">
              {label}
            </Heading>
            <Stack br="$12" p="$2" bg="$grey-50" onPress={() => setIsOpen(false)}>
              <HeroIcons.X size={16} strokeWidth={2.5} color="$grey-500" />
            </Stack>
          </XStack>
          <Stack borderBottomWidth="$0.5" borderColor="$grey-100" />
          <Stack gap="$2" ai="center">
            <Image height={150} width={150} src={value} alt={label} />
          </Stack>
        </Stack>
      </FloatingSheet>
    </>
  )
}

const NamelessValueRow = ({
  value,
  scrollRef,
}: {
  value: string
  scrollRef?: React.RefObject<ScrollViewRefType | null>
}) => {
  const { rowRef, onPress, collapsibleButton, isExpanded, truncate } = useTruncatedValue({
    truncate: value.length > 100,
    scrollRef,
  })

  return (
    <YStack
      ref={rowRef}
      bg="$tableBackgroundColor"
      borderBottomWidth={1}
      borderBottomColor="$tableBorderColor"
      gap="$1.5"
      px="$2.5"
      pl="$4"
      py="$2"
      onPress={onPress}
      pressStyle={onPress ? { backgroundColor: '$grey-100' } : undefined}
    >
      <Paragraph color="$grey-900" numberOfLines={truncate && !isExpanded ? 2 : undefined}>
        {value}
      </Paragraph>
      {collapsibleButton}
    </YStack>
  )
}

const ValueRow = ({
  label,
  value,
  scrollRef,
}: {
  label: string
  value: string
  description?: string
  scrollRef?: React.RefObject<ScrollViewRefType | null>
}) => {
  const { rowRef, onPress, collapsibleButton, isExpanded, truncate } = useTruncatedValue({
    truncate: value.length > 100,
    scrollRef,
  })

  return (
    <YStack
      ref={rowRef}
      bg="$tableBackgroundColor"
      gap="$1.5"
      px="$2.5"
      py="$2"
      borderBottomWidth={1}
      borderBottomColor="$tableBorderColor"
      onPress={onPress}
      pressStyle={onPress ? { backgroundColor: '$grey-100' } : undefined}
    >
      <Paragraph variant="annotation" color="$grey-600" fontWeight="$medium">
        {label}
      </Paragraph>
      <Paragraph color="$grey-900" numberOfLines={truncate && !isExpanded ? 2 : undefined}>
        {value}
      </Paragraph>
      {collapsibleButton}
    </YStack>
  )
}

const MultiValueRow = ({
  label,
  values,
  scrollRef,
}: {
  label: string
  values: Array<string | number>
  description?: string
  scrollRef?: React.RefObject<ScrollViewRefType | null>
}) => {
  const { rowRef, onPress, collapsibleButton, isExpanded, truncate } = useTruncatedValue({
    truncate: values.length > 5 || values.join('|').length > 100,
    scrollRef,
  })

  return (
    <YStack
      ref={rowRef}
      bg="$tableBackgroundColor"
      gap="$1.5"
      px="$2.5"
      py="$2"
      borderBottomWidth={1}
      borderBottomColor="$tableBorderColor"
      onPress={onPress}
      pressStyle={onPress ? { backgroundColor: '$grey-100' } : undefined}
    >
      <Paragraph variant="annotation" color="$grey-600" fontWeight="$medium">
        {label}
      </Paragraph>

      <Paragraph pl="$2" color="$grey-900" numberOfLines={truncate && !isExpanded ? 2 : undefined}>
        {values.map((value, index) => {
          return (
            <Paragraph color="$grey-900">
              - {value}
              {index === values.length - 1 ? '' : '\n'}
            </Paragraph>
          )
        })}
      </Paragraph>
      {collapsibleButton}
    </YStack>
  )
}
