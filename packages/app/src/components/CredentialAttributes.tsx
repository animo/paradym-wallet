import { Heading, LucideIcons, Paragraph, TableContainer, TableRow, XStack, YStack } from '@package/ui'

import { formatCredentialSubject } from '../utils'

type CredentialAttributesProps = {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  subject: Record<string, any>
  disableHeader?: boolean
  headerTitle?: string
  headerStyle?: 'regular' | 'small'
  borderStyle?: 'large' | 'small'
  attributeWeight?: 'regular' | 'medium'
  noBorder?: boolean
  showDevProps?: boolean
}

export function CredentialAttributes({
  subject,
  disableHeader = false,
  headerTitle,
  headerStyle = 'regular',
  borderStyle = 'small',
  attributeWeight = 'regular',
  showDevProps = false,
}: CredentialAttributesProps) {
  const tables = formatCredentialSubject({
    subject,
    showDevProps,
  })

  return (
    <YStack g="md">
      {tables.map((table, index) => (
        <YStack key={`${table.parent}-${table.depth}-${table.title}-${index}`} g="md" pt={table.parent ? 0 : '$2'}>
          {(table.title || headerTitle) && (
            <XStack gap="$2">
              {table.depth > 1 && <LucideIcons.CornerDownRight size="$1" />}
              {(!disableHeader || table.title) && (
                <Heading
                  variant={headerStyle === 'small' ? 'sub2' : 'h3'}
                  pl={headerStyle === 'regular' && '$2'}
                  // fontWeight={headerStyle === 'small' ? '$semiBold' : '$medium'}
                  secondary
                >
                  {table.title ?? headerTitle ?? 'Credential information'}
                </Heading>
              )}
              {table.parent && (
                <Paragraph mt="$1" variant="sub" secondary>
                  part of {table.parent}
                </Paragraph>
              )}
            </XStack>
          )}

          <TableContainer>
            {table.rows.map((row, idx) => (
              <TableRow
                key={row.key ?? (row.type === 'imageAndString' || row.type === 'string' ? row.value : row.image)}
                attribute={row.key}
                value={row.type === 'string' || row.type === 'imageAndString' ? row.value : undefined}
                isLastRow={idx === table.rows.length - 1}
                image={row.type === 'image' || row.type === 'imageAndString' ? row.image : undefined}
                borderStyle={borderStyle}
                attributeWeight={attributeWeight}
              />
            ))}
          </TableContainer>
        </YStack>
      ))}
    </YStack>
  )
}
