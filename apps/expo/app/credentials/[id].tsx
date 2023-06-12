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
      {/* FIXME: iOS should set the correct colour, but it is not. So we manually overwrite it.*/}
      <StatusBar style="light" />
      <CredentialDetailScreen />
    </>
  )
}
