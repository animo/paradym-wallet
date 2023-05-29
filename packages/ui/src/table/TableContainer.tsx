import type { PropsWithChildren } from 'react'

import { YStack, borderRadiusSizes } from '@internal/ui'

interface TableContainerProps {
  padY?: number
  padX?: number
}

export const TableContainer = ({
  children,
  padY,
  padX,
}: PropsWithChildren<TableContainerProps>) => {
  return (
    <YStack border br={borderRadiusSizes.lg} bg="$white" width="100%" px={padX ?? 0} py={padY ?? 0}>
      {children}
    </YStack>
  )
}
