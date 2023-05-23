import type { GetProps } from 'tamagui'

import { SizableText, styled } from 'tamagui'

export const Paragraph = styled(SizableText, {
  name: 'Paragraph',
  tag: 'p',
  userSelect: 'auto',
  color: '$grey.200',
  size: '$true',
})

export type ParagraphProps = GetProps<typeof Paragraph>

export const ParagraphDark = styled(Paragraph, {
  color: '$grey.200',
})
