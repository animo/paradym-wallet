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
import {
  type FormattedCredentialValue,
  type FormattedCredentialValueArray,
  type FormattedCredentialValueObject,
  formatCredentialData,
} from '../utils/formatSubject'

export type CredentialAttributesProps = {
  attributes: Record<string, unknown>
  headerTitle?: string
}

export function CredentialAttributes({ attributes, headerTitle }: CredentialAttributesProps) {
  const formattedData = formatCredentialData(attributes)

  return <FormattedCredentialAttributes attributes={formattedData} headerTitle={headerTitle} />
}

export type FormttedCredentialAttributesProps = {
  attributes: FormattedCredentialValue[]
  headerTitle?: string
}

export function FormattedCredentialAttributes({ attributes, headerTitle }: FormttedCredentialAttributesProps) {
  // Separate data into primitive values and objects at the parent level
  const primitiveItems = attributes.filter((item) => item.type !== 'object' && item.type !== 'array')
  const objectItems = attributes.filter((item) => item.type === 'object' || item.type === 'array')

  return (
    <YStack gap="$6">
      {primitiveItems.length > 0 && (
        <YStack gap="$4">
          {headerTitle && <Heading variant="sub2">{headerTitle}</Heading>}

          <TableContainer>
            {primitiveItems.map((item) => (
              <AnyRow key={`row-${item.key}`} item={item} />
            ))}
          </TableContainer>
        </YStack>
      )}

      {objectItems.map((item) => (
        <YStack key={item.key} gap="$4">
          {typeof item.name === 'string' && <Heading variant="sub2">{item.name}</Heading>}
          <TableContainer>
            {item.value.map((value) => (
              <AnyRow key={value.key} item={value} parentName={item.name} />
            ))}
          </TableContainer>
        </YStack>
      ))}
    </YStack>
  )
}

const valueToPrimitive = (value: string | number | boolean) =>
  typeof value === 'boolean' ? (value ? 'Yes' : 'No') : typeof value === 'number' ? value.toString() : value

const AnyRow = ({ item, parentName }: { item: FormattedCredentialValue; parentName?: string | number }) => {
  if (item.type === 'object' || item.type === 'array') {
    return <NestedRow parentName={parentName} item={item} />
  }

  if (item.type === 'image') {
    return <ImageRow name={item.name} value={item.value} />
  }

  if (typeof item.name === 'number' || !Number.isNaN(Number(item.name))) {
    return <NamelessValueRow value={valueToPrimitive(item.value)} />
  }

  return <ValueRow name={item.name} value={valueToPrimitive(item.value)} />
}

const NestedRow = ({
  item,
  parentName,
}: {
  item: FormattedCredentialValueArray | FormattedCredentialValueObject
  parentName?: string | number
}) => {
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
      key={`object-array-${item.key}`}
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
      <Paragraph color="$grey-900">{item.name}</Paragraph>
      <IconContainer bg="$transparent" icon={<HeroIcons.ChevronRight size={20} />} />
    </XStack>
  )
}

const ImageRow = ({ name, value }: { name: string | number; value: string }) => {
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
          <Paragraph variant="annotation" color="$grey-600" fontWeight="$medium">
            {name}
          </Paragraph>
          <Paragraph color="$grey-900">Tap to view</Paragraph>
        </YStack>
        <YStack br="$2" overflow="hidden">
          <Image height={36} width={36} src={value} alt={name.toString()} />
        </YStack>
      </XStack>
      <FloatingSheet isOpen={isOpen} setIsOpen={setIsOpen}>
        <Stack p="$4" gap="$4">
          <XStack jc="space-between">
            <Heading color="$grey-900" variant="h2">
              {name}
            </Heading>
            <Stack br="$12" p="$2" bg="$grey-50" onPress={() => setIsOpen(false)}>
              <HeroIcons.X size={16} strokeWidth={2.5} color="$grey-500" />
            </Stack>
          </XStack>
          <Stack borderBottomWidth="$0.5" borderColor="$grey-100" />
          <Stack gap="$2" ai="center">
            <Image height={150} width={150} src={value} alt={name.toString()} />
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

const ValueRow = ({ name, value }: { name: string; value: string }) => {
  const isInvalid = value === 'value-not-found'

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
        {name}
      </Paragraph>
      <Paragraph color={isInvalid ? '$danger-500' : '$grey-900'}>{isInvalid ? 'Not found' : value}</Paragraph>
    </YStack>
  )
}
