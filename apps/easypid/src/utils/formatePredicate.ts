import type { AnonCredsRequestedPredicate } from '@credo-ts/anoncreds'
import { defineMessage, t } from '@lingui/core/macro'

const predicateMessages = {
  '>': defineMessage({
    id: 'predicate.greaterThan',
    message: 'greater than',
    comment: 'Used in predicate statements like: age greater than 18',
  }),
  '>=': defineMessage({
    id: 'predicate.greaterThanOrEqual',
    message: 'greater than or equal to',
    comment: 'Used in predicate statements like: age greater than or equal to 18',
  }),
  '<': defineMessage({
    id: 'predicate.lessThan',
    message: 'less than',
    comment: 'Used in predicate statements like: age less than 18',
  }),
  '<=': defineMessage({
    id: 'predicate.lessThanOrEqual',
    message: 'less than or equal to',
    comment: 'Used in predicate statements like: age less than or equal to 18',
  }),
} as const

export function formatPredicate(requestedPredicate: AnonCredsRequestedPredicate) {
  return `${requestedPredicate.name} ${t(predicateMessages[requestedPredicate.p_type])} ${requestedPredicate.p_value}`
}
