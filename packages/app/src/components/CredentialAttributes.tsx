import { type _t, Trans, useLingui } from '@lingui/react/macro'
import type { FormattedAttribute } from '@package/agent'
import { commonMessages } from '@package/translations'
import {
  FloatingSheet,
  Heading,
  HeroIcons,
  IconContainer,
  Image,
  Paragraph,
  Stack,
  TableContainer,
  XStack,
  YStack,
} from '@package/ui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { useHaptics } from '../hooks/useHaptics'

export type CredentialAttributesProps = {
  attributes: FormattedAttribute[]
  headerTitle?: string
}

const valueToPrimitive = (t: typeof _t, value: string | number | boolean) =>
  typeof value === 'boolean'
    ? value
      ? t(commonMessages.yes)
      : t(commonMessages.no)
    : typeof value === 'number'
      ? value.toString()
      : value

export function CredentialAttributes({ attributes, headerTitle }: CredentialAttributesProps) {
  // Separate data into primitive values and objects at the parent level
  const primitiveItems = attributes.filter((item) => item.type !== 'object' && item.type !== 'array')
  const objectItems = attributes.filter((item) => item.type === 'object' || item.type === 'array')

  return (
    <YStack gap="$6">
      {primitiveItems.length > 0 && (
        <YStack gap="$4">
          {headerTitle && <Heading heading="sub2">{headerTitle}</Heading>}

          <TableContainer>
            {primitiveItems.map((item, index) => (
              <AnyRow key={`row-${index}-${item.path.join('.')}`} item={item} />
            ))}
          </TableContainer>
        </YStack>
      )}

      {objectItems.map((item, index) => (
        <YStack key={`object-${index}-${item.path.join('.')}`} gap="$4">
          {item.label && <Heading heading="sub2">{item.label}</Heading>}
          <TableContainer>
            {item.value.map((value, valueIndex) => (
              <AnyRow key={`${index}-${valueIndex}-${value.path.join('.')}`} item={value} parentName={item.label} />
            ))}
          </TableContainer>
        </YStack>
      ))}
    </YStack>
  )
}

const AnyRow = ({ item, parentName }: { item: FormattedAttribute; parentName?: string }) => {
  const { t } = useLingui()
  if (item.type === 'object' || item.type === 'array') {
    return <NestedRow parentName={parentName} item={item} />
  }

  if (item.type === 'image') {
    return <ImageRow label={item.label} value={item.value} />
  }

  // Check if label is a number or numeric string
  if (!item.label || !Number.isNaN(Number(item.label))) {
    return <NamelessValueRow value={valueToPrimitive(t, item.value)} />
  }

  return <ValueRow label={item.label} value={valueToPrimitive(t, item.value)} description={item.description} />
}

const NestedRow = ({ item, parentName }: { item: FormattedAttribute; parentName?: string }) => {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { withHaptics } = useHaptics()

  const onPress = withHaptics(() => {
    const params = new URLSearchParams({
      item: JSON.stringify(item),
    })

    if (parentName) params.set('parentName', `${parentName}`)

    router.push(`/credentials/${id}/nested?${params.toString()}`)
  })

  return (
    <XStack
      key={`object-array-${item.path.join('.')}`}
      borderTopWidth={1}
      borderTopColor="$tableBorderColor"
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
      <Paragraph color="$grey-900">{item.label}</Paragraph>
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
        borderBottomWidth={2}
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

const NamelessValueRow = ({ value }: { value: string }) => {
  return (
    <YStack
      bg="$tableBackgroundColor"
      borderBottomWidth={1}
      borderBottomColor="$tableBorderColor"
      gap="$1.5"
      px="$2.5"
      pl="$4"
      py="$2"
    >
      <Paragraph color="$grey-900">{value}</Paragraph>
    </YStack>
  )
}

const ValueRow = ({ label, value, description }: { label: string; value: string; description?: string }) => {
  // TODO: render description with an (i) or inline but not intrusive

  return (
    <YStack
      bg="$tableBackgroundColor"
      gap="$1.5"
      px="$2.5"
      py="$2"
      borderBottomWidth={1}
      borderBottomColor="$tableBorderColor"
    >
      <Paragraph variant="annotation" color="$grey-600" fontWeight="$medium">
        {label}
      </Paragraph>
      <Paragraph color="$grey-900">{value}</Paragraph>
    </YStack>
  )
}
