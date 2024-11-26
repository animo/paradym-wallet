import type { VerificationAnalysisResult } from '@easypid/use-cases/ValidateVerification'
import { HeroIcons, Spinner } from 'packages/ui/src'

interface VerificationAnalysisIconProps {
  verificationAnalysis: VerificationAnalysisResult
}

export function VerificationAnalysisIcon({ verificationAnalysis }: VerificationAnalysisIconProps) {
  if (verificationAnalysis.isLoading) return <Spinner scale={0.8} />

  if (!verificationAnalysis.result || verificationAnalysis.result.validRequest === 'could_not_determine') {
    // AI doesn't know or an error was thrown
    return null
  }

  if (verificationAnalysis.result.validRequest === 'yes') {
    return <HeroIcons.CheckCircleFilled size={26} color="$positive-500" />
  }

  return <HeroIcons.ExclamationTriangleFilled size={26} color="$danger-500" />
}
