import { Text } from 'tamagui'
import { Stack, XStack, YStack } from '../base'
import { CustomIcons, HeroIcons } from '../content'

export enum PinValues {
  One = '1',
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Zero = '0',
  Backspace = 'backspace',
  Empty = '',
  Fingerprint = 'fingerprint',
  FaceId = 'faceid',
}

const letterMap: Record<PinValues, string> = {
  [PinValues.One]: '',
  [PinValues.Two]: 'abc',
  [PinValues.Three]: 'def',
  [PinValues.Four]: 'ghi',
  [PinValues.Five]: 'jkl',
  [PinValues.Six]: 'mno',
  [PinValues.Seven]: 'pqrs',
  [PinValues.Eight]: 'tuv',
  [PinValues.Nine]: 'wxyz',
  [PinValues.Zero]: '',
  [PinValues.Fingerprint]: '',
  [PinValues.FaceId]: '',
  [PinValues.Empty]: '',
  [PinValues.Backspace]: '',
}

export interface PinNumberProps extends PinPadProps {
  character: PinValues
}

const PinNumber = ({ character, onPressPinNumber, disabled }: PinNumberProps) => {
  return (
    <Stack
      fg={1}
      jc="center"
      ai="center"
      accessible={true}
      accessibilityRole="button"
      aria-label={character === PinValues.Backspace ? 'Backspace' : `Pin number ${character}`}
      backgroundColor={
        [PinValues.Backspace, PinValues.Fingerprint, PinValues.FaceId, PinValues.Empty].includes(character)
          ? '$grey-200'
          : '$white'
      }
      pressStyle={{ opacity: 0.5, backgroundColor: '$grey-100' }}
      onPress={() => onPressPinNumber(character)}
      disabled={disabled}
      h="$6"
      w="33.33%"
      borderRightWidth="$0.5"
      borderColor="$grey-200"
    >
      {character === PinValues.Backspace ? (
        <HeroIcons.Backspace color="$grey-900" size={24} />
      ) : character === PinValues.Fingerprint ? (
        <HeroIcons.FingerPrint color="$grey-900" size={24} />
      ) : character === PinValues.FaceId ? (
        <CustomIcons.FaceId color="$grey-900" size={24} />
      ) : (
        <YStack ai="center" gap="$1">
          {/* NOTE: using fontSize $ values will crash on android due to an issue with react-native-reanimated (it seems the string value is sent to the native side, which shouldn't happen) */}
          <Text maxFontSizeMultiplier={1.2} color="$grey-900" fontWeight="500" fontSize={24}>
            {character}
          </Text>
          {/* NOTE: using fontSize $ values will crash on android due to an issue with react-native-reanimated (it seems the string value is sent to the native side, which shouldn't happen) */}
          <Text maxFontSizeMultiplier={1.2} color="$grey-500" fontSize={13}>
            {letterMap[character].toLocaleUpperCase()}
          </Text>
        </YStack>
      )}
    </Stack>
  )
}

export interface PinPadProps {
  onPressPinNumber: (character: PinValues) => void
  useBiometricsPad?: boolean
  biometricsType?: 'face' | 'fingerprint'
  disabled?: boolean
}

export const PinPad = ({ onPressPinNumber, useBiometricsPad, disabled, biometricsType }: PinPadProps) => {
  const pinValues = [
    [PinValues.One, PinValues.Two, PinValues.Three],
    [PinValues.Four, PinValues.Five, PinValues.Six],
    [PinValues.Seven, PinValues.Eight, PinValues.Nine],
    [
      useBiometricsPad ? (biometricsType === 'face' ? PinValues.FaceId : PinValues.Fingerprint) : PinValues.Empty,
      PinValues.Zero,
      PinValues.Backspace,
    ],
  ]

  const pinNumbers = pinValues.map((rowItems, rowIndex) => (
    <XStack
      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
      key={rowIndex}
      borderTopWidth="$0.5"
      borderBottomWidth={rowIndex === pinValues.length - 1 ? '$0.5' : 0}
      bc="$grey-200"
      borderColor="$grey-200"
      w="100%"
      justifyContent="center"
    >
      {rowItems.map((value, columnIndex) => (
        <PinNumber
          key={`${value}:${columnIndex}:${
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            rowIndex
          }`}
          character={value}
          onPressPinNumber={onPressPinNumber}
          disabled={disabled}
        />
      ))}
    </XStack>
  ))

  return (
    // This is not a good solution, but it's a quick fix to get the pin pad full screen without changing the whole onboarding layout
    <YStack mr={-32} ml={-32}>
      {pinNumbers}
    </YStack>
  )
}
