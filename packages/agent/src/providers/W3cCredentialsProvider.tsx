import type { AppAgent } from '../agent'
import type { PropsWithChildren } from 'react'

import { JsonTransformer, W3cCredentialRecord } from '@aries-framework/core'
import {
  recordsAddedByType,
  recordsRemovedByType,
  recordsUpdatedByType,
} from '@aries-framework/react-hooks/build/recordUtils'
import { useState, createContext, useContext, useEffect } from 'react'
import * as React from 'react'

const w3cCredentialRecords = JsonTransformer.fromJSON(
  [
    {
      id: '7526987c-15cd-4081-b03b-d835175b2188',
      type: 'w3cCredentialRecord',
      metadata: {
        '__internal/openidCredentialRendering': {},
      },
      credential: {
        type: ['VerifiableCredential', 'VerifiableCredentialExtension', 'OpenBadgeCredential'],
        issuer: {
          id: 'did:web:launchpad.vii.electron.mattrlabs.io',
          name: 'Jobs for the Future (JFF)',
          iconUrl: 'https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/images/JFF_LogoLockup.png',
          image: 'https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/images/JFF_LogoLockup.png',
        },
        name: 'JFF x vc-edu PlugFest 2',
        description: "MATTR's submission for JFF Plugfest 2",
        credentialBranding: {
          backgroundColor: '#464c49',
        },
        issuanceDate: '2023-01-25T16:58:06.292Z',
        credentialSubject: {
          id: 'did:key:z6MkpGR4gs4Rc3Zph4vj8wRnjnAxgAPSxcR8MAVKutWspQzc',
          type: ['AchievementSubject'],
          achievement: {
            id: 'urn:uuid:bd6d9316-f7ae-4073-a1e5-2f7f5bd22922',
            name: 'JFF x vc-edu PlugFest 2 Interoperability',
            type: ['Achievement'],
            image: {
              id: 'https://w3c-ccg.github.io/vc-ed/plugfest-2-2022/images/JFF-VC-EDU-PLUGFEST2-badge-image.png',
              type: 'Image',
            },
            criteria: {
              type: 'Criteria',
              narrative:
                'Solutions providers earned this badge by demonstrating interoperability between multiple providers based on the OBv3 candidate final standard, with some additional required fields. Credential issuers earning this badge successfully issued a credential into at least two wallets.  Wallet implementers earning this badge successfully displayed credentials issued by at least two different credential issuers.',
            },
            description:
              'This credential solution supports the use of OBv3 and w3c Verifiable Credentials and is interoperable with at least two other solutions.  This was demonstrated successfully during JFF x vc-edu PlugFest 2.',
          },
        },
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          {
            '@vocab': 'https://w3id.org/security/undefinedTerm#',
          },
          'https://mattr.global/contexts/vc-extensions/v1',
          'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
          'https://w3c-ccg.github.io/vc-status-rl-2020/contexts/vc-revocation-list-2020/v1.jsonld',
        ],
        credentialStatus: {
          id: 'https://launchpad.vii.electron.mattrlabs.io/core/v1/revocation-lists/b4aa46a0-5539-4a6b-aa03-8f6791c22ce3#49',
          type: 'RevocationList2020Status',
          revocationListIndex: '49',
          revocationListCredential:
            'https://launchpad.vii.electron.mattrlabs.io/core/v1/revocation-lists/b4aa46a0-5539-4a6b-aa03-8f6791c22ce3',
        },
        proof: {
          type: 'Ed25519Signature2018',
          created: '2023-01-25T16:58:07Z',
          jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..PrpRKt60yXOzMNiQY5bELX40F6Svwm-FyQ-Jv02VJDfTTH8GPPByjtOb_n3YfWidQVgySfGQ_H7VmCGjvsU6Aw',
          proofPurpose: 'assertionMethod',
          verificationMethod: 'did:web:launchpad.vii.electron.mattrlabs.io#6BhFMCGTJg',
        },
      },
    },
  ],
  W3cCredentialRecord
) as unknown as W3cCredentialRecord[]

type W3cCredentialRecordState = {
  w3cCredentialRecords: Array<W3cCredentialRecord>
  loading: boolean
}

const addRecord = (
  record: W3cCredentialRecord,
  state: W3cCredentialRecordState
): W3cCredentialRecordState => {
  const newRecordsState = [...state.w3cCredentialRecords]
  newRecordsState.unshift(record)
  return {
    loading: state.loading,
    w3cCredentialRecords: newRecordsState,
  }
}

const updateRecord = (
  record: W3cCredentialRecord,
  state: W3cCredentialRecordState
): W3cCredentialRecordState => {
  const newRecordsState = [...state.w3cCredentialRecords]
  const index = newRecordsState.findIndex((r) => r.id === record.id)
  if (index > -1) {
    newRecordsState[index] = record
  }
  return {
    loading: state.loading,
    w3cCredentialRecords: newRecordsState,
  }
}

const removeRecord = (
  record: W3cCredentialRecord,
  state: W3cCredentialRecordState
): W3cCredentialRecordState => {
  const newRecordsState = state.w3cCredentialRecords.filter((r) => r.id !== record.id)
  return {
    loading: state.loading,
    w3cCredentialRecords: newRecordsState,
  }
}

const W3cCredentialRecordContext = createContext<W3cCredentialRecordState | undefined>(undefined)

export const useW3cCredentialRecords = (): W3cCredentialRecordState => {
  const anonCredsCredentialDefinitionContext = useContext(W3cCredentialRecordContext)
  if (!anonCredsCredentialDefinitionContext) {
    throw new Error(
      'useW3cCredentialRecord must be used within a W3cCredentialRecordContextProvider'
    )
  }

  return {
    loading: false,
    w3cCredentialRecords,
  }
}

export const useW3cCredentialRecordById = (id: string): W3cCredentialRecord | undefined => {
  const { w3cCredentialRecords } = useW3cCredentialRecords()
  return w3cCredentialRecords.find((c) => c.id === id)
}

interface Props {
  agent: AppAgent
}

export const W3cCredentialRecordProvider: React.FC<PropsWithChildren<Props>> = ({
  agent,
  children,
}) => {
  const [state, setState] = useState<W3cCredentialRecordState>({
    w3cCredentialRecords: [],
    loading: true,
  })

  useEffect(() => {
    void agent.w3cCredentials
      .getAllCredentialRecords()
      .then((w3cCredentialRecords) => setState({ w3cCredentialRecords, loading: false }))
  }, [])

  useEffect(() => {
    if (!state.loading && agent) {
      const credentialAdded$ = recordsAddedByType(agent, W3cCredentialRecord).subscribe((record) =>
        setState(addRecord(record, state))
      )

      const credentialUpdate$ = recordsUpdatedByType(agent, W3cCredentialRecord).subscribe(
        (record) => setState(updateRecord(record, state))
      )

      const credentialRemove$ = recordsRemovedByType(agent, W3cCredentialRecord).subscribe(
        (record) => setState(removeRecord(record, state))
      )

      return () => {
        credentialAdded$.unsubscribe()
        credentialUpdate$.unsubscribe()
        credentialRemove$.unsubscribe()
      }
    }
  }, [state, agent])

  return (
    <W3cCredentialRecordContext.Provider value={state}>
      {children}
    </W3cCredentialRecordContext.Provider>
  )
}
