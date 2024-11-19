import type { OpenId4VciTxCode } from '@package/agent'
import { useWizard } from '@package/app'
import { CustomIcons, Heading, IllustrationContainer, Paragraph, YStack } from '@package/ui'
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
    <YStack fg={1}>
      <YStack gap="$4">
        <Heading>Enter transaction code</Heading>
        <Paragraph>
          To receive this credential you need to enter a transaction code. This transaction code should have been
          provided to you by the issuer.{'\n\n'}
          {txCode.description && (
            <>
              <Paragraph variant="sub">The issuer provided the following description:{'\n'}</Paragraph>
              <Paragraph>{txCode.description}</Paragraph>
            </>
          )}
        </Paragraph>
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
        />
      </YStack>
    </YStack>
  )
}
