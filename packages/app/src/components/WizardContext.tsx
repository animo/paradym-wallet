import { createContext, useContext } from 'react'

type WizardContextType = {
  onNext: (slide?: string) => void
  onBack: () => void
  onCancel: () => void
  completeProgressBar: () => void
}

const WizardContext = createContext<WizardContextType | undefined>(undefined)

export const WizardProvider = WizardContext.Provider

export function useWizard() {
  const context = useContext(WizardContext)
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider')
  }
  return context
}
