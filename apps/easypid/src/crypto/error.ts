import { t } from '@lingui/core/macro'
import { commonMessages } from '@package/translations'

export class InvalidPinError extends Error {
  public message = t(commonMessages.invalidPinEntered)
}
