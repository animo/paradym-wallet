import { YStack, Paragraph, TableContainer, TableRow } from '@internal/ui'

import { sanitizeString } from 'app/utils/format'

type CredentialAttributesProps = {
  subject: Record<string, string>
}

// TODO: Attributes can be nested. We should make these collapsible
// For now they render with JSON.stringify()
export default function CredentialAttributes({ subject }: CredentialAttributesProps) {
  return (
    <YStack g="md">
      <Paragraph>Information</Paragraph>
      <TableContainer>
        {Object.keys(subject).map((x, index) => (
          <TableRow
            key={x}
            attribute={sanitizeString(x)}
            value={
              typeof subject[x] === 'string' ? (subject[x] as string) : JSON.stringify(subject[x])
            }
            isLastRow={index === Object.keys(subject).length - 1}
          />
        ))}
      </TableContainer>
    </YStack>
  )
}
