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
import { useHaptics } from '@packages/app'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import {
  type FormattedCredentialItem,
  type FormattedCredentialValue,
  formatCredentialData,
} from '../utils/formatSubject'

export type CredentialAttributesProps = {
  subject: Record<string, unknown> | Record<string, FormattedCredentialValue>
  headerTitle?: string
  isFormatted?: boolean
}

export function CredentialAttributes({ subject, headerTitle, isFormatted = false }: CredentialAttributesProps) {
  // If the data is already formatted, use it directly; otherwise format it
  const formattedData: FormattedCredentialItem[] = isFormatted
    ? Object.entries(subject).map(([key, value]) => ({ key, value: value as FormattedCredentialValue }))
    : formatCredentialData(subject as Record<string, unknown>)

  // Separate data into primitive values and objects at the parent level
  const primitiveItems = formattedData.filter((item) => item.value.type !== 'object')
  const objectItems = formattedData.filter((item) => item.value.type === 'object')

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
        <YStack key={`object-${item.key}`} gap="$4">
          <Heading variant="sub2">{item.key}</Heading>
          <TableContainer>
            {Object.entries(item.value.value).map(([key, value]) => (
              <AnyRow key={`${item.key}-${key}`} item={{ key, value }} />
            ))}
          </TableContainer>
        </YStack>
      ))}
    </YStack>
  )
}

const AnyRow = ({ item }: { item: FormattedCredentialItem }) => {
  const { key, value } = item

  if (value.type === 'string' || value.type === 'date') {
    return <ValueRow key={key} name={key} value={value.value} />
  }

  if (value.type === 'boolean') {
    return <ValueRow key={key} name={key} value={value.value ? 'Yes' : 'No'} />
  }

  if (value.type === 'number') {
    return <ValueRow key={key} name={key} value={value.value.toString()} />
  }

  if (value.type === 'primitiveArray') {
    return <PrimitiveArrayRow key={key} name={key} value={value.value} />
  }

  if (value.type === 'image') {
    return <ImageRow key={key} name={key} value={value.value} />
  }

  if (value.type === 'objectArray') {
    return <ObjectArrayRow key={key} name={key} value={value.value} />
  }

  return null
}

const ObjectArrayRow = ({ name, value }: { name: string; value: FormattedCredentialItem[] }) => {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { withHaptics } = useHaptics()

  const onPress = withHaptics(() => {
    // Check if we're dealing with an array or an object
    const formattedObject: Record<string, FormattedCredentialValue> = !Array.isArray(value) ? value : {}
    if (Array.isArray(value)) {
      for (const item of value) {
        formattedObject[item.key] = item.value
      }
    }

    router.push(`/credentials/${id}/nested?name=${name}&values=${encodeURIComponent(JSON.stringify(formattedObject))}`)
  })

  return (
    <XStack
      bg="$tableBackgroundColor"
      borderBottomWidth={2}
      borderBottomColor="$tableBorderColor"
      jc="space-between"
      onPress={onPress}
    >
      <YStack>
        <YStack p="$2.5">
          <Paragraph variant="annotation" color="$grey-600" fontWeight="$medium">
            {name}
          </Paragraph>
        </YStack>
        {value.map((item) => (
          <XStack
            key={`object-array-${item.key}`}
            borderTopWidth={1}
            borderTopColor="$tableBorderColor"
            gap="$1.5"
            px="$2.5"
            pl="$4"
            py="$2"
            jc="space-between"
            ai="center"
            w="100%"
          >
            <Paragraph color="$grey-900">{item.key}</Paragraph>
            <IconContainer icon={<HeroIcons.ChevronRight size={20} />} />
          </XStack>
        ))}
      </YStack>
    </XStack>
  )
}

const ImageRow = ({ name, value }: { name: string; value: string }) => {
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
      >
        <YStack>
          <Paragraph variant="annotation" color="$grey-600" fontWeight="$medium">
            {name}
          </Paragraph>
          <Paragraph color="$grey-900">Tap to view</Paragraph>
        </YStack>
        <YStack br="$2" overflow="hidden">
          <Image height={36} width={36} src={value} alt={name} />
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
            <Image height={150} width={150} src={value} alt={name} />
          </Stack>
        </Stack>
      </FloatingSheet>
    </>
  )
}

const PrimitiveArrayRow = ({ name, value }: { name: string; value: (string | number | boolean)[] }) => {
  return (
    <YStack bg="$tableBackgroundColor" borderBottomWidth={2} borderBottomColor="$tableBorderColor">
      <YStack p="$2.5">
        <Paragraph variant="annotation" color="$grey-600" fontWeight="$medium">
          {name}
        </Paragraph>
      </YStack>
      {value.map((item) => (
        <YStack
          key={`primitive-array-${name}`}
          borderTopWidth={1}
          borderTopColor="$tableBorderColor"
          gap="$1.5"
          px="$2.5"
          pl="$4"
          py="$2"
        >
          <Paragraph color="$grey-900">{item}</Paragraph>
        </YStack>
      ))}
    </YStack>
  )
}

const ValueRow = ({ name, value }: { name: string; value: string }) => {
  return (
    <YStack
      bg="$tableBackgroundColor"
      gap="$1.5"
      px="$2.5"
      py="$2"
      borderBottomWidth={2}
      borderBottomColor="$tableBorderColor"
    >
      <Paragraph variant="annotation" color="$grey-600" fontWeight="$medium">
        {name}
      </Paragraph>
      <Paragraph color="$grey-900">{value}</Paragraph>
    </YStack>
  )
}
