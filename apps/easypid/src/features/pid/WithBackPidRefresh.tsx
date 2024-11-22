import type { PropsWithChildren } from 'react'
import { useBackgroundPidRefresh } from '../../hooks/useBackgroundPidRefresh'

export function WithBackgroundPidRefresh({ children }: PropsWithChildren) {
  // Refresh PID once it reaches 1
  useBackgroundPidRefresh(1)

  return children
}
