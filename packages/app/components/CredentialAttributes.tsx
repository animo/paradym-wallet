import { YStack, Paragraph, TableContainer, TableRow, CornerDownRight, XStack } from '@internal/ui'
import { formatCredentialSubject } from '@internal/utils'

type CredentialAttributesProps = {
  subject: Record<string, unknown>
}

export default function CredentialAttributes({ subject }: CredentialAttributesProps) {
  const tables = formatCredentialSubject(subject)

  return (
    <YStack g="md">
      {tables.map((table, index) => (
        <YStack key={index} g="md" pt={table.parent ? 0 : '$2'}>
          <XStack gap="$2">
            {table.depth > 1 && <CornerDownRight size="$1" />}
            <Paragraph>{table.title ?? 'Credential information'}</Paragraph>
            {table.parent && (
              <Paragraph mt="$1" variant="sub" secondary>
                part of {table.parent}
              </Paragraph>
            )}
          </XStack>
          <TableContainer>
            {table.rows.map((row, idx) => (
              // TODO: We sheet create a bottom sheet overlay to show the full attribute and value
              // as now it's sometimes cut off because the attribute value is too long for the view.
              // however, we can't overlay a Tamagui Sheet over a modal screen
              // so we probably need a custom implementation for this.
              <TableRow
                key={row.key}
                attribute={row.key}
                value={row.value}
                isLastRow={idx === table.rows.length - 1}
              />
            ))}
          </TableContainer>
        </YStack>
      ))}
    </YStack>
  )
}
