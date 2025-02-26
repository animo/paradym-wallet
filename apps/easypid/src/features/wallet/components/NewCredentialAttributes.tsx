import { FloatingSheet, HeroIcons, IconContainer, Image, Paragraph, TableContainer, XStack, YStack } from '@package/ui'

import { useLocalSearchParams, useRouter } from 'expo-router'
import { useHaptics } from 'packages/app/src'
import { useState } from 'react'
import { type FormattedCredentialItem, type FormattedCredentialValue, formatCredentialData } from './formatSubject'

export type NewCredentialAttributesProps = {
  subject: Record<string, unknown> | Record<string, FormattedCredentialValue>
  isFormatted?: boolean
}

export function NewCredentialAttributes({ subject, isFormatted = true }: NewCredentialAttributesProps) {
  // If the data is already formatted, use it directly; otherwise format it
  const formattedData: FormattedCredentialItem[] = isFormatted
    ? Object.entries(subject).map(([key, value]) => ({ key, value: value as FormattedCredentialValue }))
    : formatCredentialData(subject as Record<string, unknown>)

  return (
    <YStack gap="$4">
      <TableContainer>
        {formattedData.map((item) => {
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

          if (value.type === 'object') {
            console.log('ik ga hier in met', key, value.value)
            return <ObjectRow key={key} name={key} value={value.value} />
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
        })}
      </TableContainer>
    </YStack>
  )
}

const ObjectArrayRow = ({ name, value }: { name: string; value: FormattedCredentialItem[] }) => {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { withHaptics } = useHaptics()

  const onPress = withHaptics(() => {
    router.push(`/credentials/${id}/nested?name=${name}&values=${encodeURIComponent(JSON.stringify(value))}`)
  })

  return (
    <XStack
      bg="$tableBackgroundColor"
      gap="$1.5"
      px="$2.5"
      py="$4"
      borderBottomWidth={2}
      borderBottomColor="$tableBorderColor"
      jc="space-between"
      onPress={onPress}
    >
      <Paragraph color="$grey-900">
        {name} ({value.length})
      </Paragraph>
      <IconContainer icon={<HeroIcons.ChevronRight size={20} />} />
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
          <Paragraph color="$grey-900">Tap to view image</Paragraph>
        </YStack>
        <IconContainer onPress={handleOpen} variant="regular" icon={<HeroIcons.Eye size={20} />} />
      </XStack>
      <FloatingSheet isOpen={isOpen} setIsOpen={setIsOpen}>
        <YStack ai="center" jc="center" minHeight="$12" p="$6">
          <Image height={150} width={150} src={value} alt={name} />
        </YStack>
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

const ObjectRow = ({ name, value }: { name: string; value: Record<string, unknown> }) => {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { withHaptics } = useHaptics()

  const entries = Object.entries(value)

  const onPress = withHaptics(() => {
    router.push(`/credentials/${id}/nested?name=${name}&values=${encodeURIComponent(JSON.stringify(value))}`)
  })

  return (
    <XStack
      bg="$tableBackgroundColor"
      px="$2.5"
      py="$2"
      borderBottomWidth={2}
      borderBottomColor="$tableBorderColor"
      onPress={onPress}
      ai="center"
      jc="space-between"
    >
      <YStack gap="$1.5">
        <Paragraph variant="annotation" color="$grey-600" fontWeight="$medium">
          {name}
        </Paragraph>
        <Paragraph color="$grey-900">Includes {entries.length} attributes</Paragraph>
      </YStack>
      <IconContainer icon={<HeroIcons.ChevronRight size={20} />} />
    </XStack>
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
