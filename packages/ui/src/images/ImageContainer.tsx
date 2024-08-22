import type { PropsWithChildren } from 'react'
import { XStack } from '../base'

export const ImageContainer = ({ children }: PropsWithChildren) => {
  return (
    <XStack overflow="hidden" ai="center" jc="center" h="$15" border w="100%" p="$4" br="$4" bg="#dbe9fe33">
      {children}
    </XStack>
  )
}
