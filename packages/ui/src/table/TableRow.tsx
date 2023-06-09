import { XStack, Paragraph } from '../base'

interface TableRowProps {
  attribute: string
  value: string
  isLastRow: boolean
  onPress?(): void
}

export const TableRow = ({ attribute, value, isLastRow, onPress }: TableRowProps) => {
  return (
    <XStack
      pad="md"
      key={attribute}
      jc="center"
      ai="center"
      borderBottomWidth={isLastRow ? 0 : 1}
      borderBottomColor="$grey-300"
      onPress={onPress}
      pressStyle={{
        opacity: 0.8,
      }}
    >
      <Paragraph numberOfLines={1} f={1}>
        {attribute}
      </Paragraph>
      <Paragraph secondary f={1} flexGrow={1} numberOfLines={1} textAlign="right">
        {value}
      </Paragraph>
    </XStack>
  )
}
