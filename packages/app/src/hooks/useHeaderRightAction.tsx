import { IconContainer, type IconContainerProps } from '@package/ui'
import { useNavigation } from 'expo-router'
import { useEffect } from 'react'
import { Pressable } from 'react-native-gesture-handler'

interface UseHeaderRightActionProps {
  icon: IconContainerProps['icon']
  onPress: () => void
  renderCondition?: boolean
}

export function useHeaderRightAction({ icon, onPress, renderCondition = true }: UseHeaderRightActionProps) {
  const navigation = useNavigation()
  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        renderCondition ? (
          // FIXME: should remove pressable and pass it to IconContainer once
          // the following issue is resolved:
          // https://github.com/react-navigation/react-navigation/issues/12667
          <Pressable onPress={onPress} style={{ padding: 2 }}>
            <IconContainer icon={icon} />
          </Pressable>
        ) : undefined,
    })
  }, [navigation, icon, onPress, renderCondition])
}
