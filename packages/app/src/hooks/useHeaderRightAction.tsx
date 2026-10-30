import { IconContainer, type IconContainerProps, XStack } from '@package/ui'
import { useNavigation } from 'expo-router'
import { useEffect } from 'react'
import { Pressable } from 'react-native-gesture-handler'

interface UseHeaderRightActionProps {
  icon: IconContainerProps['icon']
  onPress: () => void
  renderCondition?: boolean
}

export function useHeaderRightAction(action: UseHeaderRightActionProps) {
  useHeaderRightActions([action])
}

export function useHeaderRightActions(actions: UseHeaderRightActionProps[]) {
  const navigation = useNavigation()
  useEffect(() => {
    const visibleActions = actions.filter(({ renderCondition = true }) => renderCondition)

    navigation.setOptions({
      headerRight: () =>
        visibleActions.length > 0 ? (
          <XStack gap="2">
            {visibleActions.map(({ icon, onPress }, index) => (
              // FIXME: should remove pressable and pass it to IconContainer once
              // the following issue is resolved:
              // https://github.com/react-navigation/react-navigation/issues/12667
              <Pressable key={index} onPress={onPress} style={{ padding: 2 }}>
                <IconContainer icon={icon} />
              </Pressable>
            ))}
          </XStack>
        ) : undefined,
    })
  }, [navigation, actions])

  // The actions belong to the component, which can unmount while the screen stays, such as when a pane hides
  useEffect(() => () => navigation.setOptions({ headerRight: undefined }), [navigation])
}
