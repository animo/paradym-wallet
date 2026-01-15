import type {
  FormattedSubmission,
  FormattedSubmissionEntrySatisfied,
  FormattedTransactionData,
  Ts12TransactionDataEntry,
} from '@package/agent'

export const getTransactionInputDescriptorIds = (formattedTransactionData?: FormattedTransactionData) => {
  return formattedTransactionData?.flatMap((entry) => entry.formattedSubmissions.map((s) => s.inputDescriptorId)) ?? []
}

export const getRemainingEntries = (
  submission?: FormattedSubmission,
  formattedTransactionData?: FormattedTransactionData
) => {
  const transactionInputDescriptorIds = getTransactionInputDescriptorIds(formattedTransactionData)
  return submission?.entries.filter((entry) => !transactionInputDescriptorIds.includes(entry.inputDescriptorId)) ?? []
}

export const getTransactionCards = (
  formattedTransactionData?: FormattedTransactionData,
  selectedTransactionData?: { credentialId?: string }[]
) => {
  return (
    formattedTransactionData
      ?.map((entry, index) => {
        const selected = selectedTransactionData?.[index]
        const submissions = entry.formattedSubmissions

        if (selected) {
          const cred = submissions
            .flatMap((s) => (s.isSatisfied ? s.credentials : []))
            .find((c) => c.credential.id === selected.credentialId)
          if (cred) return cred
        }
        const firstSubmission = submissions[0]
        return firstSubmission?.isSatisfied ? firstSubmission.credentials[0] : undefined
      })
      .filter((c): c is NonNullable<typeof c> => !!c) ?? []
  )
}

export const getUniqueTransactionCards = (cards: FormattedSubmissionEntrySatisfied['credentials'][0][]) => {
  return cards.filter((c, i, arr) => arr.findIndex((x) => x.credential.id === c.credential.id) === i)
}

// biome-ignore lint/suspicious/noExplicitAny: t is a macro
export const getAcceptLabel = (formattedTransactionData: FormattedTransactionData | undefined, t: any) => {
  const hasQes = formattedTransactionData?.some((t) => t.type === 'qes_authorization')
  const hasPayment = formattedTransactionData?.some((t) => t.type === 'urn:eudi:sca:payment:1')

  if (hasQes && hasPayment) {
    return t({ id: 'signPayShare.accept', message: 'Sign, pay & share' })
  }
  if (hasQes) {
    return t({ id: 'signShare.accept', message: 'Sign & share' })
  }
  if (hasPayment) {
    return t({ id: 'payShare.accept', message: 'Pay & share' })
  }
  return t({ id: 'submission.share', message: 'Share' })
}

export const formatCurrencyAmount = (amount: number, currency: string, locale: string) => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount)
  } catch (_) {
    return `${amount} ${currency}`
  }
}

export const getSelectedCredentialForEntry = (
  entry: Ts12TransactionDataEntry,
  index: number,
  selectedTransactionData?: { credentialId?: string }[]
) => {
  const selected = selectedTransactionData?.[index]
  const submissions = entry.formattedSubmissions

  if (selected) {
    return submissions
      .flatMap((s) => (s.isSatisfied ? s.credentials : []))
      .find((c) => c.credential.id === selected.credentialId)
  }

  const firstSubmission = submissions[0]
  return firstSubmission?.isSatisfied ? firstSubmission.credentials[0] : undefined
}
