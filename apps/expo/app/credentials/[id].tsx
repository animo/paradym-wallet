import { CredentialDetailScreen } from 'app/features/credentials/detail-screen'
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
