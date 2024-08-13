import { Circle, Paragraph, Text } from 'tamagui'
import { Button, Stack, XStack, YStack } from '../base'
import { HeroIcons } from '../content'

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
  Empty = '',
  Zero = '0',
  Backspace = 'backspace',
}

export interface PinNumberProps extends PinPadProps {
  character: PinValues
}

const PinNumber = ({ character, onPressPinNumber, disabled }: PinNumberProps) => {
  return (
    <Circle
      width={70}
      height={70}
      backgroundColor="$primary-400"
      pressStyle={{ opacity: 0.5 }}
      opacity={character === PinValues.Empty ? 0 : 1}
      onPress={() => onPressPinNumber(character)}
      disabled={disabled}
    >
      {character === PinValues.Backspace ? (
        <HeroIcons.Backspace color="$white" size={24} />
      ) : (
        <Text color="$white" fontWeight="$bold" fontSize="$6" fontFamily="$body">
          {character}
        </Text>
      )}
    </Circle>
  )
}

export interface PinPadProps {
  onPressPinNumber: (character: PinValues) => void
  disabled?: boolean
}

export const PinPad = ({ onPressPinNumber, disabled }: PinPadProps) => {
  const pinValues = [
    [PinValues.One, PinValues.Two, PinValues.Three],
    [PinValues.Four, PinValues.Five, PinValues.Six],
    [PinValues.Seven, PinValues.Eight, PinValues.Nine],
    [PinValues.Empty, PinValues.Zero, PinValues.Backspace],
  ]

  const pinNumbers = pinValues.map((rowItems, rowIndex) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
    <XStack key={rowIndex} height={70} gap="$4" justifyContent="center">
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

  return <YStack gap="$4">{pinNumbers}</YStack>
}
