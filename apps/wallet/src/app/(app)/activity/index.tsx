import { ActivityScreen } from '@app/features/activity/ActivityScreen'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { entityId, credentialId } = useLocalSearchParams<{ entityId?: string; credentialId?: string }>()

  return <ActivityScreen entityId={entityId} credentialId={credentialId} />
}
