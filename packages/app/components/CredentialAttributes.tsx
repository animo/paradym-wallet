import {
  YStack,
  Paragraph,
  TableContainer,
  TableRow,
  Sheet,
  Heading,
  CornerDownRight,
  XStack,
} from '@internal/ui'
import { useState } from 'react'

import { formatCredentialSubject } from 'app/utils/format'

type CredentialAttributesProps = {
  subject: Record<string, unknown>
}

export default function CredentialAttributes({ subject }: CredentialAttributesProps) {
  const tables = formatCredentialSubject(subject)
  const [modalValue, setModalValue] = useState<{ key: string; value: string } | undefined>(
    undefined
  )
  const [open, setOpen] = useState(false)

  const onOpenModal = (e: { key: string; value: string }) => {
    setModalValue(e)
    setOpen(true)
  }

  return (
    <YStack g="md">
      {tables.map((table, index) => (
        <YStack key={index} gap="$2" pt={table.parent ? '$2' : '$4'}>
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
              <TableRow
                key={row.key}
                attribute={row.key}
                value={row.value}
                onPress={() => onOpenModal(row)}
                isLastRow={idx === table.rows.length - 1}
              />
            ))}
          </TableContainer>
        </YStack>
      ))}

      <Sheet open={open} setOpen={setOpen} snapPoints={[25]}>
        {modalValue && (
          <YStack ai="center" jc="flex-start" h="100%" gap="$4">
            <Heading variant="h1">{modalValue.key}</Heading>
            <Paragraph>{modalValue.value}</Paragraph>
          </YStack>
        )}
      </Sheet>
    </YStack>
  )
}
