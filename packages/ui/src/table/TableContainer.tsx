import type { PropsWithChildren } from 'react'

import { YStack } from '../base'

interface TableContainerProps {
  padY?: string
  padX?: string
}

export const TableContainer = ({ children, padY, padX }: PropsWithChildren<TableContainerProps>) => {
  return (
    <YStack
      borderWidth={1}
      borderColor="tableBorderColor"
      bg="white"
      width="100%"
      px={padX ?? 0}
      py={padY ?? 0}
      overflow="hidden"
      rounded="6"
    >
      {children}
    </YStack>
  )
}
