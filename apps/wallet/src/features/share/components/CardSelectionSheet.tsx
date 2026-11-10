import { credentialSvgArtwork } from '@package/app/components/CredentialSvg'
import { FloatingSheet, Stack } from '@package/ui'
import type { ComponentProps } from 'react'
import { CardSelectionList } from './CardSelectionList'

type CardSelectionSheetProps = Omit<ComponentProps<typeof CardSelectionList>, 'onClose' | 'artwork'> & {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function CardSelectionSheet({ isOpen, setIsOpen, ...props }: CardSelectionSheetProps) {
  return (
    <FloatingSheet isOpen={isOpen} setIsOpen={setIsOpen}>
      <Stack p="5">
        <CardSelectionList {...props} onClose={() => setIsOpen(false)} artwork={credentialSvgArtwork} />
      </Stack>
    </FloatingSheet>
  )
}
