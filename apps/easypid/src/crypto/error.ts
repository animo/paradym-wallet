import { commonMessages } from '@package/translations'
import { t } from '@lingui/core/macro'

export class InvalidPinError extends Error {
  public message = t(commonMessages.invalidPinEntered)
}
