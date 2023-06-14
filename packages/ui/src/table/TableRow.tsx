import { Paragraph, YStack } from '../base'

interface TableRowProps {
  attribute: string
  value: string
  isLastRow: boolean
  onPress?(): void
}

export const TableRow = ({ attribute, value, isLastRow, onPress }: TableRowProps) => {
  return (
    <YStack
      p="$2.5"
      key={attribute}
      borderBottomWidth={isLastRow ? 0 : 1}
      borderBottomColor="$grey-200"
      onPress={onPress}
      pressStyle={{
        opacity: 0.8,
      }}
    >
      <Paragraph variant="text" secondary f={1}>
        {attribute}
      </Paragraph>
      <Paragraph f={1} flexGrow={1}>
        {value}
      </Paragraph>
    </YStack>
  )
}
