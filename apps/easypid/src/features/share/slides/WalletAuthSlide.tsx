import { WalletFlowAuthPrompt, type WalletFlowAuthPromptProps } from '@easypid/components/WalletFlowAuthPrompt'
import { useWizard } from '@package/app'

type WalletAuthSlideProps = Pick<WalletFlowAuthPromptProps, 'authMode' | 'onSubmit' | 'isLoading'>

export const WalletAuthSlide = ({ authMode, onSubmit, isLoading }: WalletAuthSlideProps) => {
  const { onNext } = useWizard()

  return (
    <WalletFlowAuthPrompt
      authMode={authMode}
      isLoading={isLoading}
      onSubmit={(props) => onSubmit({ ...props, onAuthorized: onNext })}
    />
  )
}
