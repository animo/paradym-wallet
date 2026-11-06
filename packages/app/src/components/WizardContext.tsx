import { createContext, useContext } from 'react'

type WizardContextType = {
  onNext: (slide?: string) => void
  onBack: () => void
  onCancel: () => void
  completeProgressBar: () => void
  // Set for a step shown next to the next step in a wide window. That step holds the buttons.
  isCombined?: boolean
  // Registers what continuing a combined step does before the wizard moves on
  setCombinedContinue?: (onContinue?: () => Promise<void>) => void
  // True while that registered action runs
  isContinuing?: boolean
  // Registers a confirmation that has to pass before continuing from the next step, such as for over-asking
  setCombinedConfirm?: (confirm?: () => Promise<boolean>) => void
  // Set for the step next to a combined step that registered a confirmation: ask it before acting
  confirmCombined?: () => Promise<boolean>
  // Set for the step shown next to the combined step before it
  isNextToPrevious?: boolean
  // Set when the step has the full width of a wide window and lays out its own panes
  ownsWideLayout?: boolean
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
