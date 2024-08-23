import { FunkePidCredentialDetailScreen } from '@ausweis/features/wallet/FunkePidCredentialDetailScreen'
import { Stack } from 'expo-router'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Credential',
          // TODO: would be nice if header dissapears when scrolling but can't get
          // the header to not show... :(
        }}
      />
      <FunkePidCredentialDetailScreen />
    </>
  )
}
