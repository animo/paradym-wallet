import { useFeatureFlag } from '@easypid/hooks/useFeatureFlag'
import type { OverAskingResponse } from '@easypid/use-cases/OverAskingApi'
import { useLingui } from '@lingui/react/macro'
import { isAndroid } from '@package/app'
import {
  AnimatedStack,
  Circle,
  Heading,
  HeroIcons,
  Image,
  InfoSheet,
  MessageBox,
  Spinner,
  Stack,
  useScaleAnimation,
  XStack,
  YStack,
} from '@package/ui'
import type { DisplayImage } from '@paradym/wallet-sdk'
import { useState } from 'react'
import { FadeIn, ZoomIn } from 'react-native-reanimated'

interface RequestPurposeSectionProps {
  purpose: string
  logo?: DisplayImage
  overAskingResponse?: OverAskingResponse
}

export function RequestPurposeSection({ purpose, logo, overAskingResponse }: RequestPurposeSectionProps) {
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false)
  const { t } = useLingui()

  const { handlePressIn, handlePressOut, pressStyle } = useScaleAnimation()
  const hasAiAnalysisFeatureFlag = useFeatureFlag('AI_ANALYSIS')

  const toggleAnalysisModal = () => setIsAnalysisModalOpen(!isAnalysisModalOpen)

  const overaskingWarningMessage = t({
    id: 'requestPurpose.overaskingWarning',
    message: 'The purpose given does not match the data requested.',
    comment: 'Warning shown when the declared purpose does not align with the data requested by the organization',
  })

  const headingLabel = t({
    id: 'requestPurpose.purposeHeading',
    message: 'PURPOSE',
    comment: 'Heading above the stated purpose of the data request',
  })

  const infoSheetTitle = t({
    id: 'requestPurpose.infoSheet.title',
    message: 'Overasking detected',
    comment: 'Title of the info sheet that appears when the user taps the warning about overasking',
  })

  const infoSheetDescription = t({
    id: 'requestPurpose.infoSheet.description',
    message:
      'This organization seems to be asking for different or more data than their purpose suggests. Read the request carefully. You can deny the request if you do not agree with the data asked.',
    comment: 'Description text in the overasking info sheet',
  })

  return (
    <>
      <YStack gap="$2">
        {overAskingResponse?.validRequest === 'no' && (
          <AnimatedStack
            entering={FadeIn}
            style={pressStyle}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={toggleAnalysisModal}
            mt={isAndroid() ? '$0' : '$-2'}
            mb="$4"
          >
            <MessageBox
              icon={<HeroIcons.InformationCircleFilled />}
              variant="error"
              message={overaskingWarningMessage}
            />
          </AnimatedStack>
        )}
        <XStack gap="$2" jc="space-between" ai="center">
          <Heading heading="sub2">{headingLabel}</Heading>
          {hasAiAnalysisFeatureFlag && (
            <Stack h="$2" w="$2" ai="center" jc="center">
              <AnimatedStack key={overAskingResponse?.validRequest} entering={ZoomIn}>
                {!overAskingResponse ? (
                  <Spinner scale={0.8} />
                ) : overAskingResponse.validRequest === 'yes' ? (
                  <HeroIcons.CheckCircleFilled size={26} color="$positive-500" />
                ) : overAskingResponse.validRequest === 'no' ? (
                  <HeroIcons.ExclamationTriangleFilled size={26} color="$danger-500" />
                ) : null}
              </AnimatedStack>
            </Stack>
          )}
        </XStack>
        <MessageBox
          variant="light"
          message={purpose}
          icon={
            <Circle size="$4" overflow="hidden">
              {logo?.url ? (
                <Image circle src={logo.url} alt={logo.altText} width="100%" height="100%" contentFit="contain" />
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
        title={infoSheetTitle}
        description={infoSheetDescription}
        onClose={toggleAnalysisModal}
      />
    </>
  )
}
