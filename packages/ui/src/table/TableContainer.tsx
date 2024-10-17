import type { PropsWithChildren } from 'react'

import { YStack } from '../base'

interface TableContainerProps {
  padY?: string
  padX?: string
}

export const TableContainer = ({ children, padY, padX }: PropsWithChildren<TableContainerProps>) => {
  return (
    <YStack
      bw={1}
      borderColor="$tableBorderColor"
      br="$6"
      bg="$white"
      width="100%"
      px={padX ?? 0}
      py={padY ?? 0}
      overflow="hidden"
    >
      {children}
    </YStack>
  )
}
