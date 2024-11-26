import type { VerificationAnalysisResult } from '@easypid/use-cases/ValidateVerification'
import {
  AnimatedStack,
  Circle,
  Heading,
  HeroIcons,
  Image,
  InfoSheet,
  MessageBox,
  Stack,
  XStack,
  YStack,
  useScaleAnimation,
} from '@package/ui'
import type { DisplayImage } from 'packages/agent/src'
import { useState } from 'react'
import { ZoomIn } from 'react-native-reanimated'
import { VerificationAnalysisIcon } from './VerificationAnalysisIcon'

interface RequestPurposeSectionProps {
  purpose: string
  logo?: DisplayImage
  verificationAnalysis?: VerificationAnalysisResult
}

export function RequestPurposeSection({ purpose, logo, verificationAnalysis }: RequestPurposeSectionProps) {
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false)

  const { handlePressIn, handlePressOut, pressStyle } = useScaleAnimation()

  const toggleAnalysisModal = () => setIsAnalysisModalOpen(!isAnalysisModalOpen)

  return (
    <>
      <YStack gap="$2">
        {verificationAnalysis?.result?.validRequest === 'no' && (
          <AnimatedStack
            style={pressStyle}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={toggleAnalysisModal}
            mb="$4"
          >
            <MessageBox
              icon={<HeroIcons.InformationCircleFilled />}
              variant="error"
              message="The purpose given does not match the data requested."
            />
          </AnimatedStack>
        )}
        <XStack gap="$2" jc="space-between" ai="center">
          <Heading variant="sub2">PURPOSE</Heading>
          <Stack h="$2" w="$2" ai="center" jc="center">
            {verificationAnalysis && (
              <AnimatedStack key={verificationAnalysis.result?.validRequest} entering={ZoomIn}>
                <VerificationAnalysisIcon verificationAnalysis={verificationAnalysis} />
              </AnimatedStack>
            )}
          </Stack>
        </XStack>
        <MessageBox
          variant="light"
          message={purpose}
          icon={
            <Circle size="$4" overflow="hidden">
              {logo?.url ? (
                <Image circle src={logo.url} alt={logo.altText} width="100%" height="100%" resizeMode="contain" />
              ) : (
                <Stack bg="$grey-200" width="100%" height="100%" ai="center" jc="center">
                  <HeroIcons.BuildingOffice color="$grey-800" size={24} />
                </Stack>
              )}
            </Circle>
          }
        />
      </YStack>
      <InfoSheet
        variant="danger"
        isOpen={isAnalysisModalOpen}
        setIsOpen={setIsAnalysisModalOpen}
        title="Overasking detected"
        description="This organization seems to be asking for different or more data than their purpose suggests. Read the request carefully. You can deny the request if you do not agree with the data asked."
        onClose={toggleAnalysisModal}
      />
    </>
  )
}
