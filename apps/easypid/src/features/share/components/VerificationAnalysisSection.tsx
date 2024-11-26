import type { VerificationAnalysisResult } from '@easypid/use-cases/ValidateVerification'
import { HeroIcons, MessageBox, Spinner } from 'packages/ui/src'

const content = {
  loading: {
    title: 'Analyzing request',
    message: 'This might take a moment',
  },
  yes: {
    title: 'Plausible request',
    message: 'Requested information matches the purpose of the request.',
  },
  no: {
    title: 'Overasking detected',
    message: 'Some information requested might not be required.',
  },
  could_not_determine: {
    title: 'Could not determine',
    message: 'The AI could not determine the request',
  },
}
// TODO: add beta/experimental icon
// Open Modal

interface VerificationAnalysisSectionProps {
  verificationAnalysis: VerificationAnalysisResult
}

export function VerificationAnalysisSection({ verificationAnalysis }: VerificationAnalysisSectionProps) {
  if (!verificationAnalysis.result || verificationAnalysis.isLoading) return <Spinner scale={0.8} />

  if (verificationAnalysis.result.validRequest === 'could_not_determine') {
    // AI doesn't know or an error was thrown
    return null
  }

  if (verificationAnalysis.result.validRequest === 'yes') {
    return <HeroIcons.CheckCircleFilled size={26} color="$positive-500" />
  }

  return <HeroIcons.ExclamationTriangleFilled size={26} color="$danger-500" />
}
