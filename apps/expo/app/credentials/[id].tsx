import { CredentialDetailScreen } from 'app/features/credentials/CredentialDetailScreen'
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
