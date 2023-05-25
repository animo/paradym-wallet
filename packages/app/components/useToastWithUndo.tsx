import { useToastController } from '@internal/ui'

type Action = () => void

interface UseToastWithUndo {
  (message: string, action: Action, undoCallback: Action): void
}

export function useToastWithUndo(): UseToastWithUndo {
  const { show } = useToastController()

  const toastWithUndo: UseToastWithUndo = (message, action, undoCallback) => {
    let undoFlag = false

    // Define the undo function to be called when the undo button is clicked
    const undoFunction = () => {
      undoFlag = true
      undoCallback()
    }

    // Show the toast
    show(message, {
      // Add an action button with the undo function
      actions: [
        {
          label: 'Undo',
          onClick: undoFunction,
        },
      ],
      // Add a close event handler to execute the action if the undo button was not clicked
      onClose: () => {
        if (!undoFlag) {
          action()
        }
      },
    }) // Type assertion as ShowToastOptions
  }

  return toastWithUndo
}
