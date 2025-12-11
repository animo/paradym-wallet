import { useRouter } from 'expo-router'
import { useCallback } from 'react'

export function usePushToWallet() {
  const router = useRouter()

  return useCallback(() => router.dismissTo('/'), [router])
}
