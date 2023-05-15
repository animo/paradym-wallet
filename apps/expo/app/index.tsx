import { H1, XStack } from '@internal/ui/src'
import { HomeScreen } from 'app/features/home/screen'
import { Stack } from 'expo-router'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <XStack pt="$10" bg="$grey-100">
              <H1>Credentials</H1>
            </XStack>
          ),
        }}
      />
      <HomeScreen />
    </>
  )
}
