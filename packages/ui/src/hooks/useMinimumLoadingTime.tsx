import { useEffect, useState } from 'react'

export const useMinimumLoadingTime = (loadingTime = 1000) => {
  const [canProceed, setCanProceed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanProceed(true)
    }, loadingTime)

    return () => clearTimeout(timer)
  }, [loadingTime])

  return canProceed
}
