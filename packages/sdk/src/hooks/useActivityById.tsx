import { useMemo } from 'react'
import { useActivities } from './useActivities'

export const useActivityById = (id: string) => {
  const { isLoading, activities } = useActivities()

  return {
    isLoading,
    activity: useMemo(() => activities.find((c) => c.id === id), [activities, id]),
  }
}
