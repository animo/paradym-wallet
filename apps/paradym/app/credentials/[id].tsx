import { CredentialDetailScreen } from '@package/app'
import { Stack } from 'expo-router'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Credential',
        }}
      />
      <CredentialDetailScreen />
    </>
  )
}
