import { useEffect, useState } from 'react'

export const useInitialRender = (delay = 500) => {
  const [isInitialRender, setIsInitialRender] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialRender(false)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  return isInitialRender
}
