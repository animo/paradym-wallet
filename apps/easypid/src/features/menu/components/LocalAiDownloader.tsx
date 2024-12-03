import { useLocalLlm } from '@easypid/hooks/useLocalLlm'
import { MessageBox, Paragraph, YStack } from 'packages/ui/src'

export function LocalAiDownloader() {
  const { error, downloadProgress, isModelReady } = useLocalLlm()

  return (
    <YStack>
      {error && <MessageBox variant="error" message={error} />}
      {isModelReady ? (
        <Paragraph>Local AI model ready to use</Paragraph>
      ) : (
        <Paragraph>Downloading model ({(downloadProgress * 100)?.toFixed(2)}%)</Paragraph>
      )}
    </YStack>
  )
}
