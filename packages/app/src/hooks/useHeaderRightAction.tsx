import { IconContainer } from '@package/ui'
import { useNavigation } from 'expo-router'
import { type ReactElement, useEffect } from 'react'

interface UseHeaderRightActionProps {
  icon: ReactElement
  onPress: () => void
}

export function useHeaderRightAction({ icon, onPress }: UseHeaderRightActionProps) {
  const navigation = useNavigation()
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <IconContainer icon={icon} onPress={onPress} />,
    })
  }, [navigation, icon, onPress])
}
