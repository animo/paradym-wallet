import assert from 'node:assert/strict'
import { test } from 'node:test'
import { pasoPaymentRulebook, validatePasoPayloadConformance, weroPaymentRulebook } from './paymentRulebook'
import { interpolatePasoTemplate, withoutDiscardedTemplateEntries } from './render'
import { getPasoRulebook } from './rulebooks'
import type { PasoClaimMetadata } from './types'

const display = (name: string) => [{ locale: 'en', name }]

const pasoPaymentClaims: PasoClaimMetadata[] = [
  { path: ['transaction_id'] },
  { path: ['amount'], value_type: 'iso_currency_amount', display: display('Amount') },
  { path: ['payee', 'name'], display: display('Payee') },
  { path: ['payee', 'id'] },
]

const weroPaymentClaims: PasoClaimMetadata[] = [
  { path: ['transaction_id'] },
  { path: ['amount'], display: display('Amount') },
  { path: ['currency'], value_type: 'iso_currency', display: display('Currency') },
  { path: ['payee', 'name'], display: display('Payee') },
  { path: ['payee', 'id'] },
]

const weroPayload = { transaction_id: 'tx-1', amount: 49, currency: 'EUR', payee: { name: 'Shop', id: 'shop-1' } }

test('a Wero payment conforms only to metadata that describes the Wero form', () => {
  const rulebook = getPasoRulebook(pasoPaymentRulebook.type, weroPayload)
  assert.equal(rulebook, weroPaymentRulebook)

  assert.deepEqual(
    validatePasoPayloadConformance({ payload: weroPayload, rulebook, claimsMetadata: weroPaymentClaims }),
    {
      conforms: true,
    }
  )
  assert.equal(
    validatePasoPayloadConformance({ payload: weroPayload, rulebook, claimsMetadata: pasoPaymentClaims }).conforms,
    false
  )
})

test('a Generic transaction takes at most 10 custom claims', () => {
  const type = 'urn:paso:sca:global:generic:1'
  const genericPayload = (count: number) => ({
    transaction_id: 'tx-1',
    ...Object.fromEntries(Array.from({ length: count }, (_, index) => [`claim_${index}`, 'value'])),
  })
  const genericClaims = (count: number): PasoClaimMetadata[] => [
    { path: ['transaction_id'] },
    ...Array.from({ length: count }, (_, index) => ({ path: [`claim_${index}`], display: display(`Claim ${index}`) })),
  ]

  const conforms = (count: number) => {
    const payload = genericPayload(count)
    const rulebook = getPasoRulebook(type, payload, genericClaims(count))
    assert.ok(rulebook)
    return validatePasoPayloadConformance({ payload, rulebook, claimsMetadata: genericClaims(count) }).conforms
  }

  assert.equal(conforms(10), true)
  assert.equal(conforms(11), false)
})

test('a template label that references a claim the payload leaves out is discarded', () => {
  const claims: PasoClaimMetadata[] = [
    { path: ['reference'] },
    {
      path: ['action'],
      display: [
        { locale: 'en', name: 'Pay for {0}', display_type: 'template:mini_markdown' },
        { locale: 'nl', name: 'Betaling' },
      ],
    },
  ]

  const [, action] = withoutDiscardedTemplateEntries(claims, { action: 'pay' })
  assert.deepEqual(action.display, [{ locale: 'nl', name: 'Betaling' }])

  const [, kept] = withoutDiscardedTemplateEntries(claims, { action: 'pay', reference: 'INV_2026_001' })
  assert.equal(kept.display?.length, 2)
})

test('a value inserted into a template stays apart from the template text', () => {
  const claims: PasoClaimMetadata[] = [{ path: ['reference'] }]

  assert.deepEqual(interpolatePasoTemplate('Reference **{0}**', claims, { reference: 'INV_2026_001' }), [
    'Reference **',
    { type: 'text', value: 'INV_2026_001' },
    '**',
  ])
})
