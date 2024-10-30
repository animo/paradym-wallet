import { IconContainer } from '@package/ui'
import { useNavigation } from 'expo-router'
import { type ReactElement, useEffect } from 'react'

interface UseHeaderRightActionProps {
  icon: ReactElement
  onPress: () => void
  renderCondition?: boolean
}

export function useHeaderRightAction({ icon, onPress, renderCondition = true }: UseHeaderRightActionProps) {
  const navigation = useNavigation()
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (renderCondition ? <IconContainer icon={icon} onPress={onPress} /> : undefined),
    })
  }, [navigation, icon, onPress, renderCondition])
}
