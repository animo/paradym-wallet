import { CredentialDetailScreen } from 'app/features/credentials/CredentialDetailScreen'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Credential',
        }}
      />
      <StatusBar style="light" />
      <CredentialDetailScreen />
    </>
  )
}
