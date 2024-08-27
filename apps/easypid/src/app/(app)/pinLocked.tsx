import { FunkePinLockedScreen } from '@easypid/features/wallet/FunkePinLockedScreen'
import { useNavigation } from 'expo-router'
import { useEffect } from 'react'

export default function Screen() {
  const navigation = useNavigation()

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
      headerShown: false,
    })
  }, [navigation])

  return <FunkePinLockedScreen />
}
