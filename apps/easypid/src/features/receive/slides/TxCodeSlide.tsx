import { useLingui } from '@lingui/react/macro'
import { useWizard } from '@package/app'
import { Heading, MessageBox, Paragraph, ScrollView, YStack } from '@package/ui'
import type { OpenId4VciTxCode } from '@paradym/wallet-sdk'
import { useState } from 'react'
import { Keyboard, type NativeSyntheticEvent, type TextInputSubmitEditingEventData } from 'react-native'
import { Input } from 'tamagui'

interface TxCodeSlideProps {
  txCode: OpenId4VciTxCode
  onTxCode: (txCode: string) => Promise<boolean>
}

export const TxCodeSlide = ({ txCode, onTxCode }: TxCodeSlideProps) => {
  const { t } = useLingui()
  const [txCodeEntry, setTxCodeEntry] = useState<string>('')
  const [isVerifying, setIsVerifying] = useState(false)
  const { onNext } = useWizard()

  const submitTxCode = async (code: string) => {
    setIsVerifying(true)
    Keyboard.dismiss()
    const success = await onTxCode(code)
    if (success) {
      onNext()
      return
    }
    setTxCodeEntry('')
    setIsVerifying(false)
  }

  const onSubmit = (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    if (txCode.length === undefined && !isVerifying) {
      void submitTxCode(event.nativeEvent.text)
    }
  }

  const onChangeTxCodeEntry = (newTxCodeEntry: string) => {
    if (isVerifying) return
    setTxCodeEntry(newTxCodeEntry)
    if (txCode.length && newTxCodeEntry.length === txCode.length) {
      void submitTxCode(newTxCodeEntry)
    }
  }

  return (
    <YStack fg={1} gap="$6">
      <ScrollView contentContainerStyle={{ gap: '$6' }} scrollEnabled={txCode.description !== undefined}>
        <YStack gap="$4">
          <Heading>
            {t({
              id: 'txCodeSlide.title',
              message: 'Enter transaction code',
              comment: 'Title prompting the user to enter a transaction code',
            })}
          </Heading>
          <Paragraph>
            {t({
              id: 'txCodeSlide.instructions',
              message:
                'To receive this card you need to enter a transaction code. This code has been provided to you by the issuer.',
              comment: 'Instructions explaining why the user must enter a transaction code',
            })}
          </Paragraph>
          {txCode.description && (
            <YStack gap="$2">
              <Paragraph>
                {t({
                  id: 'txCodeSlide.descriptionIntro',
                  message: 'The issuer provided the following:',
                  comment: 'Label shown above optional extra description',
                })}
              </Paragraph>
              <MessageBox variant="light" message={txCode.description} />
            </YStack>
          )}
        </YStack>
        <YStack gap="$2">
          <Heading heading="sub2">
            {t({
              id: 'txCodeSlide.inputLabel',
              message: 'Transaction code',
              comment: 'Label for the input field where the user types the transaction code',
            })}
          </Heading>
          <Input
            secureTextEntry
            autoFocus
            value={txCodeEntry}
            editable={!isVerifying}
            focusable={!isVerifying}
            disabled={isVerifying}
            onSubmitEditing={onSubmit}
            // Only render 'done' if length is unknown
            returnKeyType={txCode.length === undefined ? 'done' : 'none'}
            keyboardType={txCode.input_mode === 'text' ? 'ascii-capable' : 'numeric'}
            maxLength={txCode.length}
            onChangeText={(e) => onChangeTxCodeEntry(typeof e === 'string' ? e : e.nativeEvent.text)}
            placeholderTextColor="$grey-500"
            borderColor="$grey-300"
            size="$4"
          />
        </YStack>
      </ScrollView>
    </YStack>
  )
}
