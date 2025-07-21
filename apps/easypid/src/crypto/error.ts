import { t } from '@lingui/core/macro'

export class InvalidPinError extends Error {
  public message = t({
    id: 'errors.invalidPin',
    message: 'Invalid PIN entered',
    comment: 'Shown when the user enters an incorrect PIN',
  })
}
