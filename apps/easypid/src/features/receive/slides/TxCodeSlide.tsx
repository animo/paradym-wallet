import type { OpenId4VciTxCode } from '@package/agent'
import { useWizard } from '@package/app'
import { Heading, MessageBox, Paragraph, ScrollView, YStack } from '@package/ui'
import { useState } from 'react'
import type { NativeSyntheticEvent, TextInputSubmitEditingEventData } from 'react-native'
import { Input } from 'tamagui'

interface TxCodeSlideProps {
  txCode: OpenId4VciTxCode
  onTxCode: (txCode: string) => void
}

export const TxCodeSlide = ({ txCode, onTxCode }: TxCodeSlideProps) => {
  const [txCodeEntry, setTxCodeEntry] = useState<string>('')
  const { onNext } = useWizard()

  const onSubmit = (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    if (txCode.length === undefined) {
      onTxCode(event.nativeEvent.text)
      onNext()
    }
  }

  const onChangeTxCodeEntry = (newTxCodeEntry: string) => {
    setTxCodeEntry(newTxCodeEntry)
    if (txCode.length && newTxCodeEntry.length === txCode.length) {
      onTxCode(newTxCodeEntry)
      onNext()
    }
  }

  return (
    <YStack fg={1} gap="$6">
      <ScrollView contentContainerStyle={{ gap: '$6' }} scrollEnabled={txCode.description !== undefined}>
        <YStack gap="$4">
          <Heading>Enter transaction code</Heading>
          <Paragraph>
            To receive this card you need to enter a transaction code. This code has been provided to you by the issuer.
          </Paragraph>
          {txCode.description && (
            <YStack gap="$2">
              <Paragraph>The issuer provided the following:</Paragraph>
              <MessageBox variant="light" message={txCode.description} />
            </YStack>
          )}
        </YStack>
        <YStack gap="$2">
          <Heading variant="sub2">Transaction code</Heading>
          <Input
            secureTextEntry
            autoFocus
            disabled={txCode.length === undefined ? false : txCode.length === txCodeEntry.length}
            onSubmitEditing={onSubmit}
            // Only render 'done' if length is unknown
            returnKeyType={txCode.length === undefined ? 'done' : 'none'}
            keyboardType={txCode.input_mode === 'text' ? 'ascii-capable' : 'numeric'}
            maxLength={txCode.length}
            onChangeText={onChangeTxCodeEntry}
            placeholderTextColor="$grey-500"
            borderColor="$grey-300"
            size="$4"
          />
        </YStack>
      </ScrollView>
    </YStack>
  )
}
